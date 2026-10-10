import type { MigrationInterface, QueryRunner } from 'typeorm';

/** First-run data so Edge AI (ZONE_ID=1) and the dashboard work immediately. */
export class SeedDefaults1791612500000 implements MigrationInterface {
  name = 'SeedDefaults1791612500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "zones" ("name", "points") VALUES ('Default zone', '[{"x":0.3,"y":0.4},{"x":0.7,"y":0.4},{"x":0.7,"y":0.9},{"x":0.3,"y":0.9}]'::jsonb)`,
    );
    await queryRunner.query(`INSERT INTO "devices" ("name") VALUES ('esp32-1')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "devices" WHERE "name" = 'esp32-1' AND "last_seen_at" IS NULL`);
    await queryRunner.query(
      `DELETE FROM "zones" WHERE "name" = 'Default zone' AND NOT EXISTS (SELECT 1 FROM "events" WHERE "events"."zone_id" = "zones"."id")`,
    );
  }
}
