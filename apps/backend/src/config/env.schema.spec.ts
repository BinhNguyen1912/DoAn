import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.schema.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  EDGE_API_TOKEN: 'a'.repeat(16),
  DEVICE_API_TOKEN: 'b'.repeat(16),
  ESP32_BASE_URL: 'http://192.168.1.50',
};

describe('parseEnv', () => {
  it('applies defaults and transforms values', () => {
    const env = parseEnv({ ...valid, CORS_ORIGINS: 'http://a.test, http://b.test' });
    expect(env.PORT).toBe(3000);
    expect(env.EVIDENCE_ENABLED).toBe(false);
    expect(env.EVIDENCE_RETENTION_DAYS).toBe(7);
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('names every missing or invalid key', () => {
    expect(() => parseEnv({ PORT: 'abc' })).toThrow(/DATABASE_URL/);
    expect(() => parseEnv({ PORT: 'abc' })).toThrow(/EDGE_API_TOKEN/);
    expect(() => parseEnv({ PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rejects short tokens', () => {
    expect(() => parseEnv({ ...valid, EDGE_API_TOKEN: 'short' })).toThrow(/EDGE_API_TOKEN/);
  });
});
