import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791612431017 implements MigrationInterface {
    name = 'InitialSchema1791612431017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "devices" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "last_seen_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_25a895dfc7796eab1da289796fe" UNIQUE ("name"), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "zones" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "points" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_880484a43ca311707b05895bd4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "event_id" uuid NOT NULL, "zone_id" integer NOT NULL, "detected_at" TIMESTAMP WITH TIME ZONE NOT NULL, "confidence" real NOT NULL, "evidence_path" character varying(255), "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1b77463a4487f09e798dffcb43" ON "events"  ("event_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ef863c101a9f0d3d2b3e988f9" ON "events"  ("detected_at") `);
        await queryRunner.query(`CREATE TYPE "public"."alert_status" AS ENUM('sent', 'received', 'playing', 'done', 'failed')`);
        await queryRunner.query(`CREATE TABLE "alert_attempts" ("id" SERIAL NOT NULL, "event_id" integer NOT NULL, "device_id" integer NOT NULL, "status" "public"."alert_status" NOT NULL DEFAULT 'sent', "error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a19adb36f64fe59fdb4a63b04c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4254f38a4db21a63226115bb1d" ON "alert_attempts"  ("event_id") `);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_66dfa11ba7ffc6cc3595cc0d670" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_attempts" ADD CONSTRAINT "FK_4254f38a4db21a63226115bb1de" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert_attempts" ADD CONSTRAINT "FK_5c8246343259f737cf342bca050" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alert_attempts" DROP CONSTRAINT "FK_5c8246343259f737cf342bca050"`);
        await queryRunner.query(`ALTER TABLE "alert_attempts" DROP CONSTRAINT "FK_4254f38a4db21a63226115bb1de"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_66dfa11ba7ffc6cc3595cc0d670"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4254f38a4db21a63226115bb1d"`);
        await queryRunner.query(`DROP TABLE "alert_attempts"`);
        await queryRunner.query(`DROP TYPE "public"."alert_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ef863c101a9f0d3d2b3e988f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b77463a4487f09e798dffcb43"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "zones"`);
        await queryRunner.query(`DROP TABLE "devices"`);
    }

}
