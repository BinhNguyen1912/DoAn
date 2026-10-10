# 04b — Docker, CI, secrets, observability, deployment (scout research)

Date: 2026-10-10. Versions verified live today (GitHub releases API, official Docker/GitHub/Caddy/Espressif docs) — not memory.
Scope: infra for the monorepo (api/postgres/web/edge-ai/ESP32), solo dev, macOS arm64, LAN-first, possible VPS later. No app code beyond tiny snippets.

## 1. Compose layout, env, volumes, healthchecks; edge-ai in Docker?

- **Recommendation:** split compose: `compose.yaml` (base: `api`, `db`, `web`) + `compose.override.yaml`
  (auto-loaded locally: hot-reload, dev ports) + `compose.prod.yaml` for production-like
  (`docker compose -f compose.yaml -f compose.prod.yaml up -d`). `db` = postgres:18 with
  `db: pg_isready -U szm` healthcheck; `api` waits via `depends_on: db: condition: service_healthy` —
  Compose gates dependents on healthy (https://docs.docker.com/compose/how-tos/startup-order/,
  healthcheck syntax https://docs.docker.com/reference/compose-file/services/). `web` = nginx serving
  `apps/web/dist` + proxying `/api` → `api`, healthcheck on `/health`.
- Env: gitignored root `.env` consumed by Compose `${VAR}` interpolation, plus committed `.env.example`;
  `--env-file` selects alternates (https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/,
  https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/).
  Do **not** publish `db` on the host at all (internal network only; avoids the occupied 5432) —
  use `docker compose exec db psql` instead.
- Evidence JPEGs: named volume `evidence:/data/evidence` on `api`; 7-day auto-delete runs inside the app; never in git, never baked into images.
- **edge-ai: run natively, not in Docker.** Docker Desktop can attach USB devices via USB/IP, but it
  needs a privileged helper container + a USB/IP server process, and Docker "can't guarantee every
  possible USB device works" (https://docs.docker.com/desktop/features/usbip/) — webcams are exactly
  the risky class; native OpenCV avoids the whole failure mode on a single dev laptop.
- **Rejected:** one merged dev+prod compose file (can't cleanly disable hot-reload/published ports);
  Dockerized edge-ai (fragile webcam passthrough, zero benefit for one laptop).

## 2. GitHub Actions

- **Recommendation:** one workflow per app with `on.pull_request.paths` filters
  (`apps/backend/**`, `apps/web/**`, `apps/edge-ai/**`, `iot/**`) — path filtering is a built-in
  workflow feature (https://docs.github.com/actions/reference/workflow-syntax-for-github-actions).
  Gate: backend = lint → typecheck → unit tests → build → **OpenAPI drift** (regen spec,
  `git diff --exit-code`); web = lint/typecheck/test/build; Python = `ruff check` + `ruff format --check`
  + `pytest`; **gitleaks on every PR** (v8.30.1, https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1,
  official action https://github.com/gitleaks/gitleaks-action) — mandatory for a public repo.
- Caching: `actions/setup-node` cache on the lockfile, `actions/setup-python` `cache: pip`, cache `~/.arduino15` keyed on firmware pins (https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching).
- **ESP32 compile job: feasible.** `arduino/setup-arduino-cli` (https://github.com/arduino/setup-arduino-cli)
  → `arduino-cli core install esp32:esp32` → `arduino-cli compile --fqbn esp32:esp32:<board> iot/esp32-alert`;
  arduino-cli latest v1.5.1 (https://github.com/arduino/arduino-cli/releases/tag/v1.5.1). Runs only on
  `iot/**` changes; ~1–2 min once the core is cached.
- **Rejected:** one monolithic job building everything on every push (slow, mostly wasted); OS matrix
  testing (deploy target is one laptop/VPS); local-only pre-commit secret scanning (bypassable — CI is
  the enforcement point for a public repo).

## 3. Secrets / device-token provisioning

- **Recommendation:** committed `.env.example` per app (keys empty or obviously fake) + gitignored
  `.env`; backend **validates env at startup** (Nest `ConfigModule` validation / zod) and fails fast
  naming the missing key. Tokens are provisioned by hand: generate `EDGE_AI_TOKEN` /
  `ESP32_DEVICE_TOKEN` once → laptop `.env` for edge-ai, `iot/esp32-alert/secrets.h` for firmware
  (gitignored, with a committed `secrets.h.example`); backend compares with `crypto.timingSafeEqual`.
  CI-only values live in GitHub repo/environment secrets. Rotate by regenerating both copies.
- Reason: Compose/Node read env only at runtime, so no secret ever needs git history; gitleaks in CI
  catches accidental commits; firmware blobs stay clean for a public repo.
- **Rejected:** committing tokens "because it's just a LAN" (public repo = instant leak; MCU firmware
  is trivially extracted); baking tokens into Docker images (persist in layers/registry history).

## 4. Observability proportionate to a thesis

- **Recommendation:** pino JSON logs everywhere; per-request id from `pino-http`'s `genReqId`, echoed
  as `x-request-id` and attached to every line (https://github.com/pinojs/pino-http). Split probes:
  `GET /health` = liveness (process up — wire to compose healthcheck), `GET /ready` = readiness
  (DB reachable, evidence volume writable — used by proxy/deploy checks), per the startup-order doc above.
- End-to-end latency (detected → speaker started): edge-ai stamps `detected_at`, ESP32 stamps
  `speaker_started_at`, and compute the headline number as a **single-clock delta on the ESP32**
  (`speaker_started_at - detected_at`); backend adds `received_at` for hop breakdown. Never subtract
  timestamps across unsynced machines.
- **NTP pitfall (Espressif docs):** ESP32 time is invalid until SNTP sync completes — sync is async
  (`esp_netif_sntp_sync_wait()` exists to block until done), resync defaults to hourly, min interval
  15 s (RFC 4330); RTC time does not survive power-on resets; the default internal RC oscillator drifts
  "several seconds per day" in sleep
  (https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/system_time.html).
  Gate timestamping on `sntp_get_sync_status() == SNTP_SYNC_STATUS_COMPLETED`; treat device wall-clock as ±seconds.
- **Rejected:** APM/Grafana stack (overkill at one-laptop scale); trusting device wall-clock for absolute cross-machine latency (boot/drift silently corrupts results).

## 5. Deployment: LAN vs single VPS; pull vs push to the ESP32

- **Recommendation (today):** LAN-only, same compose; edge reverse proxy = **Caddy** (v2.11.7,
  https://github.com/caddyserver/caddy/releases/tag/v2.11.7) in front of `web`+`api` — automatic HTTPS
  with zero cert plumbing (https://caddyserver.com/docs/automatic-https,
  quickstart https://caddyserver.com/docs/quick-starts/reverse-proxy); nginx stays inside the stack
  serving the static build as planned in Q1.
- **If backend → VPS while ESP32 stays home:** the backend cannot dial the ESP32 (private IP behind
  NAT; inbound TCP would need port-forwarding + a stable public IP — analysis, not a cited claim).
  - **Pull (ESP32 polls backend `GET /devices/next-command` every 2–5 s + existing POST /alert):**
    simplest, one protocol, works behind any NAT; cost = command latency up to N s + constant chatter.
  - **Push (MQTT broker on VPS; ESP32 holds an outbound persistent connection):** true downlink,
    resilient via persistent sessions on flaky links (https://mqtt.org/); cost = broker container,
    MQTT client + TLS on the ESP32, more moving parts.
  - **Recommend pull now.** ESP32 downlink needs are rare (trigger/silence commands), N≈2–5 s is fine
    for a thesis, and the polling endpoint can later be fronted by an MQTT bridge without changing the
    device contract. Revisit only if you need sub-second downlink.
- **Rejected:** direct push TCP to the ESP32 (impossible through NAT); Tailscale/VPN (extra failure domain a thesis doesn't need); nginx + Certbot (more files/steps than Caddy for the same TLS).

## Recommended decisions

| decision | choice | why | risk |
|---|---|---|---|
| Compose layout | base + override/prod overlays, healthchecks, no published `db` port | clean dev/prod split; avoids host 5432 clash | exec-only DB access (acceptable) |
| Evidence storage | named volume + in-app 7-day cleanup | survives container recreation, no git/VCS leakage | volume loss = evidence loss (mitigate: periodic host backup) |
| edge-ai runtime | native on macOS, not Docker | webcam passthrough unsupported/fragile (USB/IP caveat) | "works on my laptop" only — pin deps with uv/venv |
| CI gating | path-filtered jobs + gitleaks every PR | fast feedback; public-repo secret safety | path filters skip cross-app breakage (add weekly full run) |
| ESP32 CI | arduino-cli compile on `iot/**` only | catches firmware breakage, cheap when cached | ESP32 core download flakiness (cache `~/.arduino15`) |
| Secrets | `.env`/`secrets.h` runtime provisioning, startup validation | nothing sensitive in a public repo | manual rotation — document in README |
| Latency metric | same-clock deltas + NTP sync gate | immune to laptop↔ESP32 clock skew | pre-sync events dropped (log a warning) |
| Deploy | LAN-only + Caddy now; pull-based ESP32 if VPS later | least moving parts; NAT-safe by design | poll latency up to N s (raise N if chatter matters) |

## Scaffolding steps (each independently verifiable)

1. `compose.yaml` + `.env.example` + `compose.override.yaml`: `docker compose up --health` shows `db`/`api`/`web` healthy; host 5432 untouched. Verify: `docker compose ps` all `healthy`.
2. `compose.prod.yaml` (no hot-reload, no dev ports) + evidence named volume: verify `docker compose -f compose.yaml -f compose.prod.yaml config` and a restart keeps a test file in `/data/evidence`.
3. `/health` + `/ready` endpoints in api; point compose healthcheck at `/health`. Verify: `curl` both; kill DB and see `/ready` fail while `/health` passes.
4. `.env.example` per app + startup validation that fails fast naming a missing key. Verify: run without `.env`, expect a clear error.
5. CI workflow `backend.yml` with paths filter + node cache: lint/typecheck/test/build. Verify: PR touching only `apps/web/**` skips it; PR touching backend runs it green.
6. Add OpenAPI drift check + gitleaks job. Verify: dirty the spec / plant a fake `AKIA…` key in a branch → job fails; remove → passes.
7. `python.yml` (ruff + pytest, pip cache) and `esp32.yml` (setup-arduino-cli + core install + compile, `iot/**` paths, `~/.arduino15` cache). Verify: PR touching `iot/**` compiles firmware; touching nothing else skips.
8. Local TLS edge: Caddy compose service fronting web/api. Verify: browser shows valid cert (local CA) and `/api` proxies through.
9. ESP32 `secrets.h.example` + polling endpoint stub + NTP sync-gate on the device. Verify: device logs `time synced` before first timestamped event; endpoint returns `[]` when idle.
