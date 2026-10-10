# 04a — Monorepo layout and API contract (research)

Date: 2026-10-10. Verified against npm registry and official docs on this date.
Repo: one public GitHub repo, branch `main`; solo dev, macOS arm64, Node 24, npm 11, uv; no pnpm.

## 1. Workspace tooling: npm workspaces (keep the unverified choice, with caveats)

**Recommendation:** npm workspaces for the TS side (`apps/backend`, `apps/web`, `apps/mobile`,
`packages/api-types`); `apps/edge-ai` stays a standalone uv project at the repo root next to the
workspaces. This is supported first-class by every tool in the stack.

- Expo explicitly supports workspaces via npm (root `package.json` with
  `"workspaces": ["apps/*", "packages/*"]`), and since SDK 52 Metro monorepo config is automatic —
  no manual `watchFolders`/`extraNodeModules` (https://docs.expo.dev/guides/monorepos/). Repo-wide
  duplicate autolinked native modules are force-resolved automatically "from SDK 55" for apps in
  monorepos (same page; source:
  https://github.com/expo/expo/blob/main/docs/pages/guides/monorepos.mdx).
- NestJS: plain Node resolution; `@nestjs/core@12.1.2` requires `node >= 20`, fine on Node 24
  (https://registry.npmjs.org/@nestjs/core/latest). npm workspaces spec:
  https://docs.npmjs.com/cli/using-npm/workspaces.
- Vite: resolves dependencies via standard Node resolution like Nest; the practical failure mode in
  workspaces is hoisting (gotcha 2), not the workspace model itself.

**Rejected alternatives:** pnpm — better isolation, but not installed, and Expo requires
`nodeLinker: hoisted` as the workaround when isolated installs break native modules, so the main
advantage erodes anyway (Expo monorepo guide, "Package managers with isolated dependencies").
Turborepo/Nx — remote cache, task graph, generators; overhead a solo thesis repo won't amortize.
Revisit Turborepo only if builds get slow; it layers cleanly on npm workspaces later.

**Gotchas (the one or two that matter here):**
1. Duplicate `react` / `react-native` versions are unsupported and duplicated native modules break
   builds. Keep a single version across `apps/mobile` and `apps/web` (different React majors across
   apps may need npm `"overrides"` — npm uses `overrides`, not yarn's `resolutions`; diagnose with
   `npm why react-native`). Expo monorepo guide, "Duplicate native packages within monorepos".
2. npm's hoisted install lets code accidentally import undeclared deps (flat `node_modules`).
   Declare every direct dependency explicitly in each workspace; this is the classic hoisting
   fragility noted in the Expo guide.

## 2. API contract: OpenAPI from Nest is the single source of truth

**Recommendation:**
- Backend emits the spec with `@nestjs/swagger` (`SwaggerModule.createDocument(app, config)`) and a
  tiny script writes it to `docs/openapi.json`, committed to the repo
  (https://docs.nestjs.com/openapi/introduction; saving via `writeFileSync("./spec.json", ...)` per
  https://github.com/nestjs/docs.nestjs.com/blob/master/content/openapi/other-features.md).
- CI drift check: regenerate and `git diff --exit-code docs/openapi.json`. TypeScript consumers use
  `openapi-typescript` + `openapi-fetch` (already decided; https://openapi-ts.dev/openapi-fetch/); openapi-typescript ships a `--check`
  flag ("Check that the generated types are up-to-date", https://openapi-ts.dev/cli) that fails CI
  when generated types lag the spec (repo: https://github.com/openapi-ts/openapi-typescript).
- Python edge-ai models: generate pydantic models from the same committed spec with
  `datamodel-code-generator` (official CLI for pydantic v2, reads OpenAPI 3 directly:
  https://datamodel-code-generator.koxudaxi.dev/openapi/; listed by pydantic as a dev tool). Commit
  the generated file (or regenerate in CI from the committed spec) — either is fine as long as
  `docs/openapi.json` is the only hand-edited artifact.
- The flow `edge-ai -> docs/openapi.json -> {openapi-typescript, datamodel-code-generator}` means a
  contract change breaks the edge-ai build/tests before it breaks a running laptop demo.

**ESP32 contract (hand-written, backend is the *client*):** the firmware serves `/alert` and
`/health`; Nest does not emit them, so do **not** fold them into the Nest-generated spec (it would
falsely imply backend routes). Keep `docs/esp32-api.md` beside `api-contract.md`: method, path,
JSON body of `POST /alert`, `GET /health` response, status codes, one curl example each. Optional
later: a hand-maintained `docs/openapi-esp32.yaml` linted in CI; not needed for a prototype.

**Rejected:** editing `docs/openapi.json` by hand, or having web/mobile hand-write interfaces —
both drift silently; the whole point of the committed-spec + `--check`/diff setup is that drift is a
red CI, not a runtime 500.

## 3. Python side: uv project at apps/edge-ai

**Recommendation:** `uv init apps/edge-ai`, pin `requires-python = ">=3.12,<3.14"` in
`pyproject.toml`, and commit both `uv.lock` and `.python-version` (uv reads it to pick the
interpreter). uv's project model: `pyproject.toml` at project root, `.venv` beside it (never in
git), `uv.lock` "should be checked into version control", deps added with `uv add`
(https://docs.astral.sh/uv/concepts/projects/layout/).

- **Python version:** pin 3.12 (3.13 also acceptable). Ultralytics declares
  `requires-python = ">=3.8"` with classifiers through 3.14, `opencv-python>=4.7.0`,
  `torch>=1.8.0`, plus Darwin-specific pins (numpy 2.0–2.3.4 excluded on macOS for an Accelerate
  matmul bug) that uv resolves automatically
  (https://github.com/ultralytics/ultralytics/blob/main/pyproject.toml). System Python 3.9.6 is
  end-of-life (3.9 EOL'd 2025-10, https://devguide.python.org/versions/) and unmanaged — never use
  it; uv will download its own CPython build (https://docs.astral.sh/uv/concepts/python-versions/).
- **Layout:** `src/` package layout inside `apps/edge-ai`; deps `ultralytics`, `opencv-python`,
  `httpx`; dev deps `ruff`, `pytest`, `pytest-cov` via `uv add --dev`. Lint/format with
  `uv run ruff check` + `uv run ruff format`, tests with `uv run pytest`. Put `[tool.ruff]` and
  `[tool.pytest.ini_options]` in that `pyproject.toml` (Ultralytics itself configures both there —
  same file cited above).

**Rejected:** poetry/pip+venv (slower, no built-in lock-and-sync workflow), and mixing Python into
the npm workspaces (npm cannot manage Python envs; uv is the right single tool and is already
installed).

## 4. Git conventions (solo student repo — minimum viable)

**Recommendation:**
- Conventional commits (`feat:`, `fix:`, `chore:` …), enforced locally by a commit-msg hook
  (commitlint + husky). One `husky/commit-msg` script is enough; `lint-staged` pre-commit hooks are
  optional polish, not required on day one.
- Branch protection on `main`: require a pull request before merge and require branches to be up to
  date; that's it for a solo repo. GitHub documents both
  (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
- CI (GitHub Actions, free for public repos): on PR run install, typecheck/build, `ruff check`,
  `pytest`, plus the OpenAPI drift check from §2.

**Rejected:** lefthook — faster/parallel and language-agnostic (Go binary;
https://github.com/evilmartians/lefthook), but an extra binary to install for a solo dev whose
hooks can all be `npm exec`/`uv run` commands invoked from husky; revisit only if hook latency
annoys. No CODEOWNERS, no signed commits, no multi-environment protections — not worth it yet.

## Recommended decisions

| Decision | Choice | Why | Risk |
|---|---|---|---|
| TS workspace tool | npm workspaces (`apps/*`, `packages/*`) | First-class in Expo SDK 57/Nest/Vite; no new tooling; pnpm not installed | Hoisting hides undeclared deps; mitigate by declaring deps explicitly |
| Task runner | None now (plain npm scripts) | Turborepo/Nx overhead not amortized solo | May need Turborepo if build times grow |
| Contract source of truth | Nest `@nestjs/swagger` → committed `docs/openapi.json` + CI diff check | One editable truth; drift is a red CI | Spec lags if dev forgets regen script — CI catches it |
| TS types | openapi-typescript (+ `--check`) + openapi-fetch into `packages/api-types` | Already decided; runtime-free types; `--check` guards drift | — |
| Python models | datamodel-code-generator from same spec | Same truth for edge-ai; pydantic v2 native | Generated code churn in diffs |
| ESP32 contract | Hand-written `docs/esp32-api.md` | Backend is client, not server, of `/alert`; markdown is honest | Can drift from firmware — pin example payloads |
| Python env | uv project in `apps/edge-ai`, lock + `.python-version` committed | uv installed; reproducible; keeps Python out of npm | — |
| Python version | 3.12 (system 3.9.6 is EOL) | Widest torch/opencv wheel coverage; Ultralytics allows 3.8–3.14 | 3.13 equally viable; just never use system Python |
| Git hooks | husky + commitlint commit-msg only | Minimum enforcement of conventional commits | Pre-push test gates deferred to CI |
| Branch protection | PR required on `main`, up-to-date branches | Cheap safety net even solo | — |
