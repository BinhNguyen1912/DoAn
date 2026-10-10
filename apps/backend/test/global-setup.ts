import { DataSource } from 'typeorm';
import { entities } from '../src/database/data-source.js';
import { SnakeNamingStrategy } from '../src/database/snake-naming.strategy.js';
import { ensureTestDatabase, testDatabaseUrl } from './test-env.js';

export default async function setup() {
  await ensureTestDatabase();
  const source = new DataSource({
    type: 'postgres',
    url: testDatabaseUrl(),
    entities,
    migrations: ['dist/database/migrations/*.js'],
    namingStrategy: new SnakeNamingStrategy(),
  });
  await source.initialize();
  // Start every run from a clean schema so migrations are exercised too.
  await source.dropDatabase();
  await source.runMigrations();
  await source.destroy();
}
