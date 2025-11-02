import type { Favorite } from "../entities/favorite";

export type CreateFavoriteInput = {
  movieId: string;
  title?: string;
  year?: number;
  genres?: string[];
  posterUrl?: string;
  notes?: string | null;
  rating?: number | null;
};

export type UpdateFavoriteInput = Partial<Omit<CreateFavoriteInput, "movieId">>;

export type ListOptions = {
  limit?: number;             // default 25
  cursor?: string | null;     // opaque base64 continuation token
  order?: "asc" | "desc";     // ULID-compatible time ordering by SK
};

export type ListResult = {
  items: Favorite[];
  nextCursor?: string;
};

export interface FavoritesRepository {
  listByUser(userId: string, opts?: ListOptions): Promise<ListResult>;
  getById(userId: string, id: string): Promise<Favorite | null>;
  existsByMovieId(userId: string, movieId: string): Promise<boolean>;

  create(userId: string, id: string, nowIso: string, data: CreateFavoriteInput): Promise<Favorite>;
  update(userId: string, id: string, nowIso: string, patch: UpdateFavoriteInput): Promise<Favorite | null>;
  delete(userId: string, id: string): Promise<boolean>;

  countByUser?(userId: string): Promise<number>;
}
