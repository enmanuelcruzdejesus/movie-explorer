// src/infra/secrets.ts
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { env } from "./env";

/**
 * Single Secrets Manager client per Lambda container.
 */
const sm = new SecretsManagerClient({ region: env.AWS_REGION });

/**
 * Simple in-process cache (persists across invocations while the container is warm).
 * Keyed by a string; value is whatever the getter returns.
 */
const secretCache = new Map<string, unknown>();

/**
 * Fetch a secret's string value from Secrets Manager.
 * - Supports SecretString and SecretBinary.
 * - Cached in-memory per container.
 */
export async function getSecretString(secretIdOrArn: string): Promise<string> {
  const cacheKey = `raw:${secretIdOrArn}`;
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey) as string;
  }

  const out = await sm.send(new GetSecretValueCommand({ SecretId: secretIdOrArn }));
  const payload =
    out.SecretString ??
    (out.SecretBinary ? Buffer.from(out.SecretBinary).toString("utf-8") : "");

  if (payload == null) {
    throw new Error(`Secret "${secretIdOrArn}" returned no payload.`);
  }

  secretCache.set(cacheKey, payload);
  return payload;
}

/**
 * Fetch and parse a JSON secret: { ... }.
 * Throws if the payload is not valid JSON.
 */
export async function getJsonSecret(
  secretIdOrArn: string
): Promise<Record<string, unknown>> {
  const cacheKey = `json:${secretIdOrArn}`;
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey) as Record<string, unknown>;
  }

  const raw = await getSecretString(secretIdOrArn);
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    throw new Error(
      `Secret "${secretIdOrArn}" is not valid JSON. Original error: ${(err as Error).message}`
    );
  }
  secretCache.set(cacheKey, json);
  return json;
}

/**
 * Obtain the OpenAI API key with the following precedence:
 * 1) env.OPENAI_API_KEY (useful for local dev, CI)
 * 2) env.OPENAI_SECRET_ARN → if JSON, read "OPENAI_API_KEY" prop; if plain string, use it directly
 */
export async function getOpenAIKey(): Promise<string> {
  // 1) Direct env var (local/dev-friendly)
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0) {
    return env.OPENAI_API_KEY.trim();
  }

  // 2) Secrets Manager (JSON or plain string)
  if (env.OPENAI_SECRET_ARN && env.OPENAI_SECRET_ARN.trim().length > 0) {
    // Try JSON first
    try {
      const json = await getJsonSecret(env.OPENAI_SECRET_ARN);
      const val = json["OPENAI_API_KEY"];
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
      // If JSON didn't contain the expected key, fall through to raw-as-string
    } catch {
      // Ignore JSON parse error and try raw string
    }

    const raw = (await getSecretString(env.OPENAI_SECRET_ARN)).trim();
    if (raw.length > 0) return raw;
  }

  throw new Error(
    "OPENAI_API_KEY is not configured. Set env OPENAI_API_KEY or provide OPENAI_SECRET_ARN pointing to a secret (JSON with {OPENAI_API_KEY} or plain string)."
  );
}

/**
 * Utility for tests to clear the in-process cache.
 */
export function __clearSecretsCacheForTests(): void {
  secretCache.clear();
}
