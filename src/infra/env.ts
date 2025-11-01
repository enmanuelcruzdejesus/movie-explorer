// src/infra/env.ts
import Joi from "joi";

/**
 * Joi schema for environment variables.
 * - Converts types (e.g., strings → numbers) via prefs({ convert: true }).
 * - Aggregates all validation errors (abortEarly: false).
 * - Allows unknown env vars so you can add more later without breaking.
 */
const EnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  STAGE: Joi.string().default("dev"),
  AWS_REGION: Joi.string().min(1).required().messages({
    "any.required": "AWS_REGION is required",
    "string.empty": "AWS_REGION is required",
  }),
  FAVORITES_TABLE_NAME: Joi.string().min(1).required().messages({
    "any.required": "FAVORITES_TABLE_NAME is required",
    "string.empty": "FAVORITES_TABLE_NAME is required",
  }),

  // Caching / AI
  AI_PROVIDER: Joi.string().valid("openai", "heuristic").default("openai"),
  RECO_TTL_HOURS: Joi.number().integer().positive().default(12),

  // Secrets
  OPENAI_SECRET_ARN: Joi.string().allow("").optional(),
  OPENAI_API_KEY: Joi.string().optional(), // local/dev fallback

  // Local dev (DynamoDB Local)
  DYNAMODB_LOCAL_URL: Joi.string().uri().optional(),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("fatal", "error", "warn", "info", "debug", "trace", "silent")
    .default("info"),
})
  .unknown(true)
  .prefs({ convert: true, abortEarly: false });

const { value, error } = EnvSchema.validate(process.env);

if (error) {
  const details = error.details.map((d) => d.message).join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

/** Explicit TypeScript type for consumers */
export type Env = {
  NODE_ENV: "development" | "test" | "production";
  STAGE: string;
  AWS_REGION: string;
  FAVORITES_TABLE_NAME: string;

  AI_PROVIDER: "openai" | "heuristic";
  RECO_TTL_HOURS: number;

  OPENAI_SECRET_ARN?: string;
  OPENAI_API_KEY?: string;

  DYNAMODB_LOCAL_URL?: string;

  LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
};

export const env: Env = value as unknown as Env;
