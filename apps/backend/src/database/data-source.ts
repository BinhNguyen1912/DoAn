import { DataSource } from 'typeorm';
import { AlertAttempt } from '../alerts/alert-attempt.entity.js';
import { Device } from '../devices/device.entity.js';
import { SafeZoneEvent } from '../events/event.entity.js';
import { Zone } from '../zones/zone.entity.js';
import { SnakeNamingStrategy } from './snake-naming.strategy.js';

// The TypeORM CLI does not read .env, so load it here (Node >= 20.12).
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on the process environment.
}

/** Entities in one place so the app and the CLI cannot drift apart. */
export const entities = [Zone, Device, SafeZoneEvent, AlertAttempt];

/** Used by the TypeORM CLI (migration:generate / migration:run). */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: ['dist/database/migrations/*.js'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
