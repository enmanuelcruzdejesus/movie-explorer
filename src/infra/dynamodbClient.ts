import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "./env";

const isLocal = Boolean(env.DYNAMODB_LOCAL_URL);

export const ddb = new DynamoDBClient({
  region: env.AWS_REGION,
  ...(isLocal
    ? {
        endpoint: env.DYNAMODB_LOCAL_URL,
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : {}),
});

export const docClient = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: { wrapNumbers: false },
});

export const FavoritesTable = env.FAVORITES_TABLE_NAME;
