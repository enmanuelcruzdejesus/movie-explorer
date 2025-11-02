import {
  GetCommand,
  QueryCommand,
  UpdateCommand,
  TransactWriteCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, FavoritesTable } from "../../../infra/dynamodbClient";
import { fromItem, toItem, Key, type Favorite, type FavoriteItem } from "../../entities/favorite";
import type {
  FavoritesRepository,
  CreateFavoriteInput,
  UpdateFavoriteInput,
  ListOptions,
  ListResult,
} from "../favoritesRepository";

function encodeCursor(key: Record<string, unknown> | undefined): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key), "utf8").toString("base64");
}
function decodeCursor(cursor?: string | null): Record<string, unknown> | undefined {
  if (!cursor) return undefined;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

export class DynamoFavoritesRepository implements FavoritesRepository {
  private readonly table = FavoritesTable;
  private readonly gsi1 = "GSI1";

  async listByUser(userId: string, opts: ListOptions = {}): Promise<ListResult> {
    const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
    const startKey = decodeCursor(opts.cursor);
    const forward = (opts.order ?? "desc") === "asc";

    const out = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skpref)",
        ExpressionAttributeValues: {
          ":pk": Key.userPK(userId),
          ":skpref": "FAV#",
        },
        Limit: limit,
        ExclusiveStartKey: startKey,
        ScanIndexForward: forward,
      })
    );

    const items = (out.Items ?? []).filter((i) => i.Type === "FAVORITE") as FavoriteItem[];
    return {
      items: items.map(fromItem),
      nextCursor: encodeCursor(out.LastEvaluatedKey),
    };
  }

  async getById(userId: string, id: string): Promise<Favorite | null> {
    const out = await docClient.send(
      new GetCommand({
        TableName: this.table,
        Key: { PK: Key.userPK(userId), SK: Key.favSK(id) },
      })
    );
    const item = out.Item as FavoriteItem | undefined;
    if (!item || item.Type !== "FAVORITE") return null;
    return fromItem(item);
  }

  async existsByMovieId(userId: string, movieId: string): Promise<boolean> {
    const out = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: this.gsi1,
        KeyConditionExpression: "GSI1PK = :gpk AND GSI1SK = :gsk",
        ExpressionAttributeValues: {
          ":gpk": Key.gsi1PK(userId),
          ":gsk": movieId,
        },
        Limit: 1,
        ProjectionExpression: "PK", // minimal read
      })
    );
    return (out.Count ?? 0) > 0;
  }

  /**
   * Strong unique constraint on (userId, movieId) using a transactional 'unique marker':
   * - Item A: the Favorite
   * - Item B: the unique marker with PK=UQ#USER#{userId}#MOVIE, SK=MOVIE#{movieId}
   */
  async create(userId: string, id: string, nowIso: string, data: CreateFavoriteInput): Promise<Favorite> {
    const fav: Favorite = {
      id,
      userId,
      movieId: data.movieId,
      title: data.title,
      year: data.year,
      genres: data.genres,
      posterUrl: data.posterUrl,
      notes: data.notes ?? null,
      rating: data.rating ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const favItem = toItem(fav);

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.table,
              Item: favItem,
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
          {
            Put: {
              TableName: this.table,
              Item: {
                PK: Key.uqPK(userId),
                SK: Key.uqSK(data.movieId),
                Type: "FAVORITE_UQ",
                userId,
                movieId: data.movieId,
                favId: id,
                createdAt: nowIso,
              },
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
        ],
      })
    );

    return fav;
  }

  async update(userId: string, id: string, nowIso: string, patch: UpdateFavoriteInput): Promise<Favorite | null> {
    // No movieId change allowed (service should enforce too)
    const allowed: (keyof UpdateFavoriteInput)[] = [
      "title", "year", "genres", "posterUrl", "notes", "rating",
    ];
    const entries = Object.entries(patch).filter(([k, v]) => allowed.includes(k as any) && v !== undefined);

    // If nothing to update, just return current (or null if absent)
    if (entries.length === 0) {
      return await this.getById(userId, id);
    }

    const sets: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    let i = 0;

    for (const [k, v] of entries) {
      const nk = `#k${i}`;
      const nv = `:v${i}`;
      names[nk] = k;
      values[nv] = v;
      sets.push(`${nk} = ${nv}`);
      i++;
    }
    // always bump updatedAt
    names["#updatedAt"] = "updatedAt";
    values[":now"] = nowIso;
    sets.push("#updatedAt = :now");

    const out = await docClient.send(
      new UpdateCommand({
        TableName: this.table,
        Key: { PK: Key.userPK(userId), SK: Key.favSK(id) },
        ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );

    const item = out.Attributes as FavoriteItem | undefined;
    return item ? fromItem(item) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    // Need the movieId to remove the unique marker
    const current = await this.getById(userId, id);
    if (!current) return false;

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: this.table,
              Key: { PK: Key.userPK(userId), SK: Key.favSK(id) },
              ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
            },
          },
          {
            Delete: {
              TableName: this.table,
              Key: { PK: Key.uqPK(userId), SK: Key.uqSK(current.movieId) },
            },
          },
        ],
      })
    );

    return true;
  }

  // Optional helper for quotas
  async countByUser(userId: string): Promise<number> {
    // NOTE: For large datasets this will undercount past 1MB; acceptable for soft limits.
    const out = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skpref)",
        ExpressionAttributeValues: {
          ":pk": Key.userPK(userId),
          ":skpref": "FAV#",
        },
        Select: "COUNT",
      })
    );
    return out.Count ?? 0;
  }
}
