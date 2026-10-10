import { z } from 'zod';

/**
 * Environment contract for the backend.
 *
 * To add a setting: add it to a section below (or create a new section),
 * then document it in `.env.example`. The app refuses to start if any value
 * is missing or invalid, and the error names the offending key.
 */

const bool = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const appSection = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  /** Comma-separated list of allowed browser origins; empty disables CORS. */
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

const databaseSection = z.object({
  DATABASE_URL: z
    .string()
    .refine((value) => /^postgres(ql)?:\/\//.test(value), {
      message: 'must start with postgres:// or postgresql://',
    }),
});

const authSection = z.object({
  /** Shared secret that the Edge AI service sends to the backend. */
  EDGE_API_TOKEN: z.string().min(16),
  /** Shared secret that the backend sends to the ESP32 and the ESP32 echoes back. */
  DEVICE_API_TOKEN: z.string().min(16),
});

const esp32Section = z.object({
  ESP32_BASE_URL: z.url(),
  ESP32_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).default(3000),
  ALERT_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),
  DEVICE_HEARTBEAT_INTERVAL_MS: z.coerce.number().int().min(1000).default(10000),
});

const evidenceSection = z.object({
  /** Evidence images are off by default for privacy. */
  EVIDENCE_ENABLED: bool.default(false),
  EVIDENCE_DIR: z.string().min(1).default('./data/evidence'),
  EVIDENCE_RETENTION_DAYS: z.coerce.number().int().min(1).default(7),
  EVIDENCE_MAX_BYTES: z.coerce.number().int().min(1024).default(2_000_000),
});

export const envSchema = appSection
  .extend(databaseSection.shape)
  .extend(authSection.shape)
  .extend(esp32Section.shape)
  .extend(evidenceSection.shape);

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}
