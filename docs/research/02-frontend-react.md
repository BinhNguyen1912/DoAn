# 02 — Frontend: React + Vite production dashboard (scout research)

Date: 2026-10-10. All versions verified against official docs/releases today.
Scope: how to scaffold the Safe Zone Monitor web dashboard (LAN-first SPA, solo dev, 8 weeks).

## 1. Versions & scaffold

- **React 19.3.0** (stable, released 2026-09-09) — https://react.dev/versions
- **Vite 8.3.x** (current minor, gets regular patches; older majors only get security fixes) — https://vite.dev/releases
- **TypeScript**: latest stable is **7.0.2** (the Go port, announced 2026-08) — https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — **but** TS 7 has no stable programmatic API yet, so tooling (typescript-eslint, Volar-style tools) still runs on the 6.x API. The official create-vite `react-ts` template therefore pins `typescript ~6.0.2`.
- **Node**: use **24.x LTS** (Active LTS, v24.21.0) for dev/CI/Docker base. Node 26 is "Current", not LTS. Vite 8 requires Node 20.19+/22.12+ — https://nodejs.org/en/about/previous-releases, https://vite.dev/guide/
- Scaffold (official command, `react-ts` template):
  ```
  npm create vite@latest safe-zone-dashboard -- --template react-ts
  ```
  — https://vite.dev/guide/#scaffolding-your-first-vite-project
- Template facts (from `packages/create-vite/template-react-ts/package.json` on vitejs/vite main, 2026-10-10): react `^19.3.0`, vite `^8.3.3`, `@vitejs/plugin-react ^6.1.2`, build = `tsc -b && vite build`, lint script = **oxlint** (template no longer ships ESLint).

Rejected: TS 7 for now (tooling gaps, see above — revisit when typescript-eslint supports it); Node 26 (non-LTS, Vite CI doesn't test odd/current-only lines).

## 2. Folder structure

**Feature folders, shallow.** One page-cluster per feature, shared code in `lib/`/`ui/`:

```
src/
  app/           # router, providers, error boundary, layout
  features/
    zones/       # ZoneEditor.tsx, polygon.ts (geometry helpers), api.ts
    events/      # EventList.tsx, EventRow.tsx, api.ts, stateLabels.ts
    device/      # DeviceStatus.tsx, api.ts
  lib/           # api client (openapi-fetch wrapper), queryClient, env
  ui/            # tiny shared components (Button, Banner, Spinner)
```

Layers (`components/`, `hooks/`, `services/`) scatter one feature's code across 4 dirs — worse for a solo dev navigating alone. Feature folders also make the later stats page a new directory, not a reshuffle. Keep it flat until a folder exceeds ~8 files.

## 3. Data fetching & routing

**TanStack Query v5 (currently 5.104.1)** — https://tanstack.com/query/latest, version from `packages/react-query/package.json` on TanStack/query main.

It is purpose-built for exactly this app's hard part: `refetchInterval` polling (device status, event list), `refetchIntervalInBackground` for a dashboard left open in a tab, built-in pause when the browser is offline + retry/backoff, and `useMutation` + `invalidateQueries` so a saved polygon refreshes dependent views — https://tanstack.com/query/latest/docs/framework/react/guides/polling. Note: polling timers are per-observer; dedupe only collapses concurrent fetches (same doc).

**Challenge to the "no heavy state library" choice (verified, refined):** keep it for *client* state (no Redux/Zustand — local `useState` + context suffices), but TanStack Query is a *server-state* library, not an app-state library; it is the single highest-leverage dependency here. Rejected alternatives: plain `fetch` + `useEffect` polling (you hand-roll cancellation, dedupe, retry, cache, error states — this is where the 5 alert states × polling × error UI gets buggy); SWR (https://swr.vercel.app — solid, `refreshInterval` exists, but weaker mutation/invalidation story for the zone-save flow).

**Routing: yes — React Router v8**, package `react-router` (v7 merged declarative+data+framework modes; v8 is current, see https://reactrouter.com/home and https://reactrouter.com/start/modes). Use **Declarative mode** (`<BrowserRouter>` + `<Routes>`): 3–4 views (dashboard/zone editor, event history, device, later stats). Rejected: no router / tab-state hack (no deep links, breaks browser refresh on a LAN URL); Framework mode (SSR/servelet features useless behind static nginx).

## 4. Typed API client

**Generate types from the backend's OpenAPI spec with openapi-typescript** (+ its `openapi-fetch` client), spec exported by `@nestjs/swagger` from the NestJS app — https://openapi-ts.dev ("Convert OpenAPI 3.0/3.1 schemas to TypeScript types and create type-safe fetching", zero runtime cost), https://docs.nestjs.com/openapi/quick-start, https://github.com/nestjs/swagger.

- One `npm run gen:api` script pulls `http://localhost:3000/api/docs/json` (or a checked-in `openapi.json`) into `src/lib/api/schema.d.ts`.
- The **OpenAPI JSON is the contract** shared with the future mobile app: any client generator (openapi-typescript, orval, Flutter's OpenAPI generator) consumes the same artifact — no TS type can be shared with a non-TS mobile app anyway.
- Rejected: hand-written types (drift against a backend that the Edge AI + mobile also hit; the alert-state enum WILL diverge); **Orval** full codegen (v8, generates TanStack Query hooks + MSW mocks — https://orval.dev — powerful but more moving parts than a solo MVP needs; reconsider if the API grows).

## 5. Polygon editing (one polygon over a reference photo)

**Hand-roll it** (~150–250 lines). A single-editable-polygon tool is: one `<polygon points>` + one `<circle>` handle per vertex, `onPointerDown/Move/Up` (React DOM pointer-event props: https://react.dev/reference/react-dom/components/common#props), `element.setPointerCapture()` during drags, coordinates from `svg.getBoundingClientRect()` (https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

- **Normalized handling**: store `{x,y}` in 0..1; on render multiply by the overlay's current pixel size; on input divide by it. Coordinates are resolution- and photo-size-independent — exactly what `PUT /api/zones/:id` should persist.
- **Resize behavior**: absolutely position the SVG over the `<img>` inside one container; set the container to the photo's aspect ratio (`aspect-ratio` CSS from the image's natural size). Pixel coords are derived every render, so no resize listeners are needed.
- **Pitfalls**: (1) `object-fit: cover` letterboxing breaks pixel↔normalized math — use `aspect-ratio` container instead; (2) do **not** use `viewBox="0 0 1 1"` + `preserveAspectRatio="none"` — it distorts stroke widths and handle circles; (3) touch: add `touch-action: none` on handles or drags scroll the page; (4) too-small hit targets — render handles ~8px with a transparent 24px hit circle; (5) clamp 0..1 and enforce ≥3 vertices before save; (6) distinguish click-to-add vs drag-the-image with pointer capture, not click handlers.
- Rejected: konva/react-konva, fabric.js (canvas raster world, larger than the need, normalized coords still hand-managed); react-moveable (generic transform UI, not polygon-shaped). SVG keeps it inspectable and testable.

## 6. UI kit, styling, i18n

**Tailwind CSS v4.3.3 via the official `@tailwindcss/vite` plugin** — https://tailwindcss.com/docs/installation/using-vite (Vite 8 support landed in v4.2.2, per https://github.com/tailwindlabs/tailwindcss/releases). v4 is CSS-first (`@import "tailwindcss";`, no `tailwind.config.js` needed).

Optional: **shadcn/ui** copy-in components (Dialog/Table/Badge) for the event history — components live in your repo, no runtime dep — https://ui.shadcn.com. Rejected: MUI and Mantine (https://mui.com, https://mantine.dev) — heavyweight component runtimes and theming systems for a 3–4 view LAN dashboard; plain CSS (fine technically, but slower to iterate on table/banner/status layouts).

Accessibility: semantic HTML + `aria-live="polite"` on the device-status and toasts so polling state changes are announced; visible focus rings (Tailwind `focus-visible:` utilities).

**Vietnamese UI: no i18n framework for MVP.** One hardcoded locale; extract strings to a `vi.ts` messages module so a future second locale is a rename. Add react-i18next only if English is a real requirement — https://react.i18next.com. Ensure the chosen font ships the Vietnamese block (U+1EA0–1EF9) — system font stacks and Inter/"Be Vietnam Pro" (Google Fonts `subset=vietnamese`) do; otherwise diacritics silently fall back per-glyph.

## 7. Env, dev proxy, CORS

- `VITE_`-prefixed vars are **inlined at build time** into the bundle — public, never secrets — https://vite.dev/guide/env-and-mode. Type them via `ImportMetaEnv` augmentation in `src/vite-env.d.ts` (same doc).
- Keep `VITE_API_BASE_URL` defaulting to `''` (same-origin `/api`). LAN deployment = nginx serves `dist/` and proxies `/api` to NestJS, so **dev and prod use the same relative URLs** — no runtime config file needed for MVP. (If one static build must be pointed at different backends later, add a `public/config.json` fetched at boot — not built-in, ~20 lines.)
- Dev: `server: { proxy: { '/api': 'http://localhost:3000' } }` — https://vite.dev/config/server-options#server-proxy. This removes CORS from dev entirely; in prod, same-origin removes it entirely. Only if a cross-origin deploy appears would NestJS need `enableCors()` — https://docs.nestjs.com/techniques/cors.

## 8. Testing & lint

- **Vitest 5.0.3** (latest, 2026-09-30) + `@testing-library/react` for unit/component tests — https://vitest.dev, version: https://github.com/vitest-dev/vitest/releases. Vite-native, Jest-compatible.
- **MSW 3.0.3** (2026-10-10) to mock the NestJS API for both Vitest and Playwright — https://mswjs.io (intercepts real network via service worker; same handlers reused in tests and as a dev stub when the backend is down). Perfect for testing the "backend down" error states deterministically.
- **Playwright 1.64.0** (2026-10-07) for ~3 e2e happy paths only: draw+save zone, event list shows alert states, device-offline banner — https://playwright.dev/docs/intro (`npm init playwright@latest`).
- Lint/format: the template ships **oxlint** (keep it for the MVP — zero config). If you want the mainstream stack instead: **ESLint flat config** + typescript-eslint + eslint-plugin-react-hooks + Prettier — https://eslint.org/docs/latest/use/configure/configuration-files. **Biome 2.5.15** (2026-09-30) is the fast lint+format-in-one alternative, ~97% Prettier-compatible — https://biomejs.dev. Pick ONE; for 8 weeks do not run two linters.

## 9. Production build & deploy

- `vite build` → `dist/` with **content-hashed asset filenames** — https://vite.dev/guide/build. nginx: `try_files $uri /index.html` for SPA fallback — https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files; `location /api { proxy_pass http://backend:3000; }`.
- Caching: `index.html` → `no-cache` (it references the new hashes); `/assets/` → `immutable, max-age=1y` (hashed names make this safe).
- **Dockerfile multi-stage**: `node:24-alpine` stage runs `npm ci && npm run build`; final stage `nginx:alpine` copies only `dist/` + the site config — https://docs.docker.com/build/building/multi-stage/. Alternative (skip nginx): serve `dist/` from NestJS `@nestjs/serve-static` — https://docs.nestjs.com/recipes/serve-static — fewer containers, but couples frontend deploys to backend restarts. Prefer nginx.
- **Error boundary** around the app + per-route: React class `getDerivedStateFromError`/`componentDidCatch`, or the `react-error-boundary` package React itself points to — https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary. Monitoring for MVP: boundary UI + `console`/nginx access logs; TanStack Query devtools in dev. Sentry (self-hosted or cloud) only after real deployment.

## 10. Auth

**MVP: nginx HTTP Basic auth** in front of the whole SPA + API (`auth_basic` + `auth_basic_user_file`, htpasswd) — https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html. Zero app code, browser handles the prompt, survives SPA refreshes, works with the polling endpoints transparently.

- Rejected for MVP: full JWT login flow (login page, token refresh, protected routes) — real work with no thesis value on a trusted LAN; leaving it open (any device on the LAN reaches the API — Basic auth is the cheapest real gate).
- **Room for real auth later**: keep every network call inside the single fetch wrapper in `lib/api/` so adding a `Bearer` header or login page later touches one module. If cookies + CSRF ever replace Basic auth, that's a backend + wrapper change, not a feature rewrite.

## Recommended decisions

| Decision | Choice | Why | Risk |
|---|---|---|---|
| Scaffold | `npm create vite@latest -- --template react-ts`, React 19.3, Vite 8.3 | Official, current stable; template pinned & tested together | — |
| TypeScript | Template's TS ~6.0 (not 7.0) | TS7 lacks stable tooling API; upgrade later is mechanical | Stays behind ~1 major temporarily |
| Node | 24 LTS everywhere (dev/CI/Docker) | Active LTS per Node release page | — |
| Server state | TanStack Query v5 | Polling, retry, offline pause, mutation invalidation built in | One dep (~13KB gz); "no lib" choice amended |
| Client state | None (useState/context) | App has almost no shared client state | — |
| Routing | React Router v8, Declarative mode | Deep links + refresh for 3–4 views; smallest mode | — |
| API types | openapi-typescript + openapi-fetch from NestJS OpenAPI JSON | One contract shared with mobile; no drift | Requires exporting spec in CI |
| Polygon editor | Hand-rolled SVG, normalized 0..1 coords | One polygon; no lib fits; SVG is testable | ~250 LOC owned by you |
| Styling | Tailwind v4 (+ optional shadcn/ui) | Fast iteration, small runtime, Vite plugin | — |
| i18n | None for MVP; strings in one `vi.ts` | Single locale is a real requirement now | Cheap to add react-i18next later |
| Env/API URL | Same-origin `/api`; dev via Vite proxy | No CORS, no runtime config on LAN | Cross-origin deploys need NestJS CORS |
| Tests | Vitest + MSW; ~3 Playwright e2e | Highest bug-catch per hour for solo dev | E2e maintenance if UI churns |
| Lint | Keep template oxlint (or ESLint flat; or Biome — one only) | Zero/low config for 8 weeks | — |
| Deploy | Multi-stage Docker → nginx (dist + `/api` proxy, hash-based caching) | Static files, independent restarts, LAN-friendly | — |
| Error states | Error boundary + TanStack Query error UI + MSW-tested offline states | (d) is a stated requirement | — |
| Auth | nginx Basic auth now; single fetch wrapper as the future auth seam | Real gate, zero app code; JWT slots in later | Shared credential, no per-user audit |

Sources were fetched live on 2026-10-10; version numbers come from official release pages/manifests, not memory.
