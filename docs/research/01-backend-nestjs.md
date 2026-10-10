# 01 — Scaffolding a production-grade NestJS backend (Safe Zone Monitor)

Researched 2026-10-10 against live npm registry and official docs (not memory). Versions below were
verified today via `npm view`/registry and official release pages.

## 1. Versions and scaffold

- **Recommendation:** NestJS **12.1.2** (`@nestjs/core`, CLI **12.0.8**), Node **24 LTS** (Active LTS,
  24.21.0), TypeScript **~6.0.x** as pinned by the scaffold. Scaffold with
  `npx @nestjs/cli@latest new safe-zone-api` (prompts: package manager, ESM/CommonJS, Observe).
  Pick **CommonJS** → Jest, or **ESM** → Vitest; both use **oxlint**; `src/` + `test/`, `strict` on by
  default (https://docs.nestjs.com/cli/usages).
- Evidence: latest Nest = 12.1.2 (https://registry.npmjs.org/@nestjs/core/latest); v12 release notes —
  ESM-ready packages, Standard Schema validation, `@nestjs/observe`, **Node v20.19+/v22.12+ required,
  latest Active LTS recommended** (https://github.com/nestjs/nest/releases, migration guide
  https://docs.nestjs.com/migration-guide). Node status: v24 = LTS, v26.11.1 = Current (not LTS);
  "Production applications should only use Active LTS or Maintenance LTS releases"
  (https://nodejs.org/en/about/previous-releases/).
- **TypeScript:** npm `latest` is **7.0.2** (https://registry.npmjs.org/typescript/latest), but
  `nest upgrade` "bumps TypeScript to v6 (**required by the v12 CLI and schematics**)"
  (https://docs.nestjs.com/cli/usages), and the CLI itself depends on `typescript ~6.0.2`
  (https://registry.npmjs.org/@nestjs/cli/latest). So: keep the scaffold's TS 6.x; treat TS 7 as
  adopt-after-verification. Jest projects on v12 need Node ≥24.9 (`require(esm)` note in same CLI doc).
- Rejected: Node 26 Current (not LTS yet — not for production), TS 7 on day one (unverified against
  Nest 12 toolchain), global-CLI-first install (prefer `npx`/local dependency).

## 2. ORM and migrations — TypeORM choice is acceptable (kept)

- **Recommendation:** keep **TypeORM** (`@nestjs/typeorm` 12.0.2 + `typeorm` **1.1.2**; peer allows
  `^0.3.0 || ^1.0.0-dev` — verified via `npm view @nestjs/typeorm peerDependencies`). `synchronize:
  false` always; workflow: edit entities → `typeorm migration:generate` → **review SQL** →
  `migration:run` at deploy (https://typeorm.io/docs/migrations/setup,
  https://typeorm.io/docs/migrations/generating). Nest's own warning: "Don't use `synchronize: true` in
  production; otherwise, you can lose production data" (https://docs.nestjs.com/data/typeorm).
- Rejected/alternatives:
  - **Prisma** — excellent (`prisma migrate deploy`, https://www.prisma.io/docs/cli/migrate/deploy), but
    npm `latest` currently resolves to **8.0.0-rc.22** while the last stable is **7.10.0**
    (`npm view prisma dist-tags`, 2026-10-10): moving-target versioning + separate schema/codegen layer
    on top of learning Nest.
  - **Drizzle** (0.45.4) — SQL-first migrations (https://orm.drizzle.team/docs/migrations); lighter, but
    entity/repository story differs from Nest's documented first-class path
    (https://docs.nestjs.com/data/drizzle).
  - **MikroORM** (7.2.5) — supported by Nest (https://docs.nestjs.com/data/mikroorm), but identity-map/
    Unit-of-Work concepts are extra cognitive load for a solo 8-week build.
- Note: TypeORM moved to 1.x in 2026 (`typeorm` latest 1.1.2; `legacy` tag = 0.3.31) — pin exact
  versions in the lockfile. Keep both `up()` and `down()` in every migration; never edit an applied one.

## 3. Folder / module layout (solo-student simple)

- **Recommendation:** one feature module per domain — `src/zones`, `src/events`, `src/devices`,
  `src/alerts` — each `*.module.ts` + controller + service + `dto/` + `entities/`; shared `src/common/`
  (filters, guards, pipes) and `src/config/` (env schema). Root `AppModule` only wires imports.
  Generate with `nest g resource`/`nest g module` (https://docs.nestjs.com/cli/usages).
- Rejected: monorepo/workspaces (overkill), deep layered folders per feature, a "shared" module that
  everything imports (becomes a dumping ground).
- Why: modules + controllers + providers is the official unit of organization
  (https://docs.nestjs.com/modules, https://docs.nestjs.com/controllers); four features fit one app
  easily; controllers stay thin, logic lives in services.

## 4. Config and env validation

- **Recommendation:** `@nestjs/config` (12.0.1) `ConfigModule.forRoot({ isGlobal: true, validationSchema })`
  with a **Zod** schema (zod 4.6.5) — validation throws during bootstrap on missing/invalid vars;
  docs explicitly say "For new projects, we recommend a modern Standard Schema library such as Zod"
  (https://docs.nestjs.com/application/configuration; Zod example there). Use `getOrThrow()` for required
  values; commit a `.env.example`, gitignore `.env`, inject secrets via compose `env_file`/environment —
  "Do not hardcode environment variables … use environment variables or a secrets manager"
  (https://docs.nestjs.com/deployment).
- Rejected: reading `process.env` ad hoc (fails late, at first use), Joi (still supported but needs
  Joi v18+, and Zod is now the documented default), unvalidated YAML custom config (docs note config
  files are not auto-validated).

## 5. Validation and OpenAPI for typed clients

- **Recommendation:** request DTOs as classes with **class-validator** (0.15.1) +
  `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, plus
  **`@nestjs/swagger` (12.0.2) with the Swagger CLI plugin** so `nest build` auto-annotates DTOs — no
  manual `@ApiProperty`. Serve Swagger UI and expose `/api-json`
  (https://docs.nestjs.com/openapi/introduction, plugin: https://docs.nestjs.com/openapi/cli-plugin);
  generate TS clients for React/mobile from that spec (e.g. openapi-typescript/orval/openapi-generator —
  spec is the official interchange format, https://openapi-generator.com).
- Rejected: **zod-only DTOs** — first-class in Nest 12 via `StandardSchemaValidationPipe` and Standard
  Schema (https://docs.nestjs.com/application/validation, https://github.com/nestjs/nest/releases), so
  valid, but the class + CLI-plugin route automates OpenAPI annotations and mapped types with less code;
  hand-rolled response typing (drifts from reality).
- Keep Zod where it wins: env validation (§4).

## 6. ESP32 command/ack reliability + scheduled jobs

- **Recommendation:** **DB-driven outbox/state machine — no queue yet.** `alert_attempt` rows with
  `state ∈ {sent, received, playing, done, failed}`, unique `(event_id)` for idempotency, attempt count +
  `next_attempt_at`. A worker (`@nestjs/schedule` `@Interval`/`@Cron`, every 1–5 s) claims due rows
  (`UPDATE … WHERE state='sent' AND next_attempt_at<=now() RETURNING` / `FOR UPDATE SKIP LOCKED`), POSTs
  to the ESP32 with an HTTP timeout (`AbortSignal.timeout`), records the result, retries with backoff up
  to N attempts → `failed`. Device ack is a separate idempotent POST (`event_id` upsert): **HTTP 200 on
  send only advances `sent → received`**; only the device's ack advances to `playing`/`done`.
  State-in-DB as the source of truth follows the transactional-outbox idea
  (https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).
- **BullMQ rejected for now:** BullMQ/Bull "use Redis to persist job data, so you need a running Redis
  instance" (https://docs.nestjs.com/application/queues; https://docs.bullmq.io/) — an extra service for
  a single-laptop, low-rate event stream whose retries you must reconcile with DB state anyway. Revisit
  if you run multiple API instances or need long delayed/recurring jobs.
- Scheduled jobs (`@nestjs/schedule` 12.0.2, https://docs.nestjs.com/application/task-scheduling):
  daily cron deletes evidence files older than 7 days (then their rows/path), and a per-minute cron marks
  devices offline when `last_heartbeat` exceeds a threshold. Import `ScheduleModule.forRoot()` **once**
  (docs warn each extra import re-registers every job).

## 7. Evidence JPEG upload

- **Recommendation:** multipart via `FileInterceptor` with Multer options `limits: { fileSize, files }`
  and `storage: diskStorage` writing a server-generated filename (UUID + `.jpg`) under a configurable
  dir outside the static root; validate with `ParseFilePipe` (`MaxFileSizeValidator`,
  `FileTypeValidator` jpeg) (https://docs.nestjs.com/http/file-upload; Multer options
  https://github.com/expressjs/multer#multeropts). DB stores only the path; serve the image through an
  authenticated endpoint (never `express.static` the whole dir); the §6 cleanup cron enforces the 7-day
  deletion.
- Rejected: storing base64 in Postgres (bloat), trusting the client filename/path (traversal), buffering
  unlimited uploads in memory (DoS).

## 8. Health, logging, errors, CORS, rate limit, headers, LAN auth

- **Health:** `@nestjs/terminus` (12.1.0) readiness/liveness routes with `TypeOrmHealthIndicator` +
  `MemoryHealthIndicator`/`DiskHealthIndicator` (https://docs.nestjs.com/reliability/terminus).
- **Logging:** built-in `Logger`; v12 logs plain objects as structured params (JSON under `params`) —
  `logger.log('Alert sent', { eventId, deviceId })` (https://github.com/nestjs/nest/releases); keep
  stdout-only for container log collection (https://docs.nestjs.com/application/logger).
- **Errors:** one global exception filter; use `HttpException(…, { errorCode: 'DEVICE_UNREACHABLE' })` —
  v12 serializes stable machine-readable `errorCode`s clients can branch on
  (https://github.com/nestjs/nest/releases, https://docs.nestjs.com/exception-filters).
- **CORS:** `app.enableCors({ origin: [dashboard URL], methods: [...] })` — set methods explicitly
  (https://docs.nestjs.com/security/cors).
- **Rate limit:** `@nestjs/throttler` (6.7.1; peer includes `@nestjs/core ^12`) global `ThrottlerGuard`,
  `@SkipThrottle()` on health/ack endpoints (https://docs.nestjs.com/security/rate-limiting).
- **Headers:** Nest ≥12.1 built-in `app.useSecurityHeaders()` — Helmet 8 defaults, no extra package
  (https://docs.nestjs.com/security/helmet).
- **Auth:** now — separate static bearer tokens for Edge-AI and ESP32 checked by a custom guard (constant-
  time compare), distinct scopes/routes; `/health` public. Later web/mobile — JWT access/refresh with
  guards (`https://docs.nestjs.com/security/authentication`); add CSRF only if you switch the web app to
  cookie auth (https://docs.nestjs.com/security/csrf). Rejected: one shared token for all callers.

## 9. Testing and lint/format

- **Recommendation:** follow scaffold defaults — **Vitest** (if ESM) or **Jest** (if CJS), `@nestjs/testing`
  (12.1.2) `Test.createTestingModule`, e2e in `test/` with **Supertest** (7.3.1) against
  `createNestApplication()` + `init()` (https://docs.nestjs.com/fundamentals/testing). Run integration
  tests against a **real Postgres via Testcontainers** (throwaway container per run,
  https://node.testcontainers.org/) or the compose DB. Lint: **oxlint** (1.87.0, scaffold default) +
  **Prettier** (3.9.9, `nest new --format`) (https://docs.nestjs.com/cli/usages).
- Rejected: mocking the DB everywhere (misses SQL/migration bugs), snapshot-only tests for API contracts,
  adding ESLint+Prettier+stylelint stacks the scaffold no longer generates.

## 10. Docker and production checklist

- **Recommendation:** multi-stage Dockerfile — builder `node:24` (`npm ci`, `npm run build`), runtime
  `node:24-slim` (`npm ci --omit=dev`, copy `dist/` only, `USER node`, `CMD ["node","dist/main"]`), plus
  `.dockerignore` (`node_modules`, `dist`, `.env`, `.git`) (official Nest sample uses `node:24` /
  `node dist/main`: https://docs.nestjs.com/deployment; multi-stage rationale:
  https://docs.docker.com/build/building/multi-stage/; images: https://hub.docker.com/_/node).
- `docker-compose.yml`: `api` (build ., `depends_on` healthy postgres, named volume for evidence dir,
  healthcheck hitting `/health/readiness`, `restart: unless-stopped`) + `postgres:18` (current stable as
  of 2026-10-10; PG19 RC1 due 2026-10-15 — https://www.postgresql.org/about/newsarchive/) with
  `pgdata` volume, `pg_isready` healthcheck, port bound to `127.0.0.1` only. Run migrations as a release
  step before/at app start (`typeorm migration:run`), never `synchronize`.
- Checklist that matters here: `NODE_ENV=production`; secrets only via env (`.env` never in image/git);
  non-root container; upload size limits + rate limits on; CORS origin pinned; health endpoint wired to
  the compose healthcheck; **named volumes for Postgres data and evidence images** + scheduled backups;
  structured logs to stdout; pinned image/digest versions; migration tested against a copy of prod data;
  LAN-only port exposure (reverse proxy + TLS if it ever leaves the laptop);
  https://docs.nestjs.com/deployment.

## Recommended decisions

| Decision | Choice | Why | Risk |
|---|---|---|---|
| Framework | NestJS 12.1.2 | Current stable, official docs, modular for 4 features | v12 is recent (Sep 2026) — fewer blog posts; docs cover it |
| Runtime | Node 24 LTS | Active LTS; v26 not LTS yet; Nest recommends Active LTS | Upgrade to 26 once it hits LTS |
| TypeScript | ~6.0.x (scaffold pin) | v12 CLI/schematics require TS 6; TS 7.0.2 unverified | Delayed TS 7 adoption; re-check at upgrade |
| Scaffold/module system | `nest new` → CommonJS (Jest) or ESM (Vitest); oxlint | Official defaults; CJS = widest tooling compat, ESM = future default | ESM + TypeORM CLI interop friction (mitigate: run migrations via `typeorm-ts-node-esm`/script) |
| ORM | TypeORM 1.1.2 + `@nestjs/typeorm` 12.0.2 | User's choice is sound: first-class Nest path, entity classes, mature migrations | Migration generation must be reviewed; pin exact version (1.x just shipped) |
| Migrations | generate → review → run; `synchronize:false` | Data-loss prevention (Nest docs warning) | Manual SQL review discipline |
| Config | @nestjs/config + Zod schema | Fails fast at bootstrap; documented default | None material |
| Request validation | class-validator + Swagger CLI plugin (Zod for env) | Auto-annotated DTOs → `/api-json` typed clients | Two schema libs (classes vs Zod) — contained to different layers |
| Alert delivery | DB state machine + `@nestjs/schedule` poller; unique `event_id` | No Redis needed; ack ≠ HTTP 200; retry/timeout/idempotent in one place | Single-instance poll loop; revisit BullMQ if scaling out |
| Evidence storage | Multer diskStorage, server filename, path in DB, 7-day cron | Simple, bounded, matches spec | Local-disk only — needs volume backup; move to object storage on VPS if needed |
| Ops baseline | Terminus health + structured logs + `errorCode` + CORS + throttler + `useSecurityHeaders()` | Cheap, official, all Nest-12-native | Throttler in-memory (fine for one instance) |
| Auth | Static bearer tokens now, JWT later | Edge-AI/ESP32 need only a shared secret on a LAN | Token rotation is manual until JWT lands |
| Packaging | Multi-stage `node:24` image + compose (api+postgres:18) | Reproducible on laptop, portable to VPS | Backups/volumes are manual until automated |

## Risks / gaps

- Prisma's npm `latest` RC quirk and TypeORM 1.x are both moving targets — re-verify versions at scaffold
  time (`npm view`).
- TS 7 / Node 26 compatibility with Nest 12 is unverified today; not needed for week 1.
- ESP32 HTTP ack over LAN: assume flaky Wi-Fi — the §6 timeout/retry/`failed` states are mandatory, not
  optional. Device clock skew: record `received_at` server-side, trust `detected_at` only from Edge-AI.
- Evidence dir and Postgres live on one laptop disk: one `docker compose down -v` or disk failure loses
  everything — schedule backups from day 1.
