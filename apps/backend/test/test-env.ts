import { Client } from 'pg';

try {
  process.loadEnvFile('.env');
} catch {
  // CI provides the environment directly.
}

export const TEST_TOKENS = { edge: 'e'.repeat(24), device: 'd'.repeat(24) };

/** Same server as DATABASE_URL, but a dedicated `<name>_test` database. */
export function testDatabaseUrl(): string {
  const url = new URL(process.env.DATABASE_URL ?? '');
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}

export async function ensureTestDatabase(): Promise<void> {
  const target = new URL(testDatabaseUrl());
  const name = target.pathname.slice(1);
  const admin = new URL(target);
  admin.pathname = '/postgres';
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (found.rowCount === 0) await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
}
