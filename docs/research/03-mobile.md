# 03 — Mobile framework choice (scout research)

Date: 2026-10-10. All versions verified against official docs/releases today.
Scope: pick the mobile framework and how to scaffold it for Safe Zone Monitor (events list + evidence image, device online/offline, later push). Mobile is NOT in the MVP; the parent wants the scaffold decided now. Requirement: reuse the existing NestJS REST/OpenAPI backend; scaffold must be production-oriented but tiny. The unverified "Expo + TypeScript" choice is confirmed below, with one amendment: do not assume Expo Go on the stores works — in 2026 it lags SDKs, so the demo path is a dev build / `eas go` / emulator.

## 1. Framework comparison for THIS use case

| Criterion | Expo / React Native | Flutter | PWA of the existing web app |
|---|---|---|---|
| Learning cost (knows TS/React) | Near zero new language; React + TS directly | Dart + widget paradigm; new mental model, no reuse of React knowledge | Zero — it IS the web dashboard |
| Code sharing with web | Types/API client/zod shared via npm workspace; UI logic mostly not shared | Dart only; nothing shared with TS web app | 100% sharing by definition |
| Push notifications | Full: Expo Push Service wraps FCM/APNs, free ([FAQ](https://docs.expo.dev/push-notifications/faq/)) | Full (FCM/APNs) but more wiring | Worst: iOS requires the site installed to Home Screen ([WebKit 16.4+](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)); needs HTTPS + service worker; no badges, flaky |
| LAN HTTP on real devices | Android: cleartext blocked 9+ by default, one flag (`usesCleartextTraffic`, [expo-build-properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)). iOS: ATS exception `NSAllowsLocalNetworking` ([Apple](https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity/nsallowslocalnetworking)) + iOS 14+ local-network permission prompt ([Apple](https://developer.apple.com/documentation/bundleresources/information-property-list/nslocalnetworkusagedescription)) — same problems as everyone | Same OS-level restrictions, more manual native config | Service worker + push require a secure context (HTTPS or localhost) per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) — plain `http://192.168.x.x` PWA gets no push, no install prompt reliability |
| Demo build/distribution | Emulator/simulator free; Android APK sideload free (`npx expo run:android` / EAS internal distribution, [docs](https://docs.expo.dev/build/internal-distribution/)); iOS physical device needs Apple Developer $99/yr (TestFlight or ad-hoc) | Similar native builds, no managed shortcut | Deploy URL — trivial, but re-introduces "why not PWA for everything" question |

Verdict per question: **Expo wins on every axis that matters here** except "zero new stack", which only the PWA offers — and the PWA fails the push requirement (especially on iOS) and does not deliver a real "app" artifact for a thesis demo. Flutter is rejected: nothing shared with the TS web stack ([Flutter for React Native devs](https://docs.flutter.dev/get-started/flutter-for/react-native-devs) exists, but it's a second language for the whole team-of-one). Pure native (Kotlin/Swift) rejected: two codebases, no sharing, weeks of extra learning. PWA kept as a tactical fallback for MVP-week notifications (see §3), not as the mobile app.

## 2. Current stable versions & scaffold (verified 2026-10-10)

- **Expo SDK 57 = current stable** (React Native 0.86, React 19.2) — [sdk-57 changelog](https://expo.dev/changelog/sdk-57). Use `expo@57.0.17+` (fixes Hermes V1 memory/startup regressions). SDK lifetime ~1 year ([policy](https://expo.fyi/outdated-sdk-versions)).
- **SDK 58 is in beta** (RN 0.88 RC, built for iOS 27, 3–4 week beta) — [sdk-58-beta](https://expo.dev/changelog/sdk-58-beta). Do **not** scaffold on it; it will be stable "shortly after RN 0.88 ships" (RN 0.88 release date: 2026-10-12, per [RN releases overview](https://reactnative.dev/releases/overview)). Upgrade later with `npx expo install expo@latest --fix`.
- React Native: 0.86 and 0.87 are the Active stable lines ([overview](https://reactnative.dev/releases/overview)).
- **New Architecture is the only architecture**: default since RN 0.76 ([blog](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here)); SDK 55 removed Legacy entirely and deleted the `newArchEnabled` flag ([sdk-55 changelog](https://expo.dev/changelog/sdk-55)). Nothing to configure.
- Official scaffold: `npx create-expo-app@latest` ([docs](https://docs.expo.dev/get-started/create-a-project/)). The default template already includes **Expo Router** (file-based routing, recommended for new apps — [Router intro](https://docs.expo.dev/router/introduction/)), Native Tabs, and a `/src/app` layout ([sdk-55 changelog](https://expo.dev/changelog/sdk-55)). Since SDK 56 the CLI prompts whether to target the App Store Expo Go version or the latest SDK — pick latest SDK.
- **Expo Go caveat (2026 reality)**: store versions lag badly; SDK 57's Expo Go is still awaiting Apple approval, available only via `eas go` (TestFlight, needs paid Apple account) or CLI-installed on Android / simulators ([May 2026 update](https://expo.dev/changelog/expo-go-and-app-store-may-2026), [sdk-57](https://expo.dev/changelog/sdk-57)). Plan the demo on **emulator (iOS sim / Android) + one Android dev build APK**; treat iOS physical-device demo as optional ($99 account).

## 3. Push notifications — defer native push, ship Telegram first

- **Expo Push Service (recommended later)**: free, 600 msg/s per project ([FAQ](https://docs.expo.dev/push-notifications/faq/)); NestJS just POSTs to Expo's HTTP API with `expo-server-sdk` ([sending docs](https://docs.expo.dev/push-notifications/sending-notifications/)); client needs `expo-notifications` + EAS `projectId` ([setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)). Cost is mostly credentials plumbing: FCM service-account + APNs key in EAS. **Hard constraint: remote push requires a dev build — removed from Expo Go on Android since SDK 53** ([notifications SDK ref](https://docs.expo.dev/versions/latest/sdk/notifications/)).
- **Telegram bot (recommended NOW)**: no mobile app, no store, no credentials plumbing — NestJS sends one HTTPS POST to `sendMessage` ([Bot API](https://core.telegram.org/bots/api)); works with the phone the student already has; also serves the web dashboard's alerting need. ~2–3 h in the backend.
- **PWA push**: rejected as primary (iOS Home-Screen-only requirement, HTTPS requirement, no service worker on LAN HTTP — see §1). Revisit only if the web app moves to HTTPS on a VPS.
- **Deferral plan**: Telegram bot during MVP; Expo Push when the mobile app gets its first dev build; never build the FCM/APNs-direct path ([more complex, no benefit at this scale](https://docs.expo.dev/push-notifications/sending-notifications/)).

## 4. Sharing types/API client across web + mobile

- Repo already has `apps/{backend,edge-ai,mobile,web}` — formalize it: **npm workspaces** (root `package.json` `workspaces: ["apps/*", "packages/*"]`) + one `packages/api-types`. Expo supports workspaces first-class and auto-configures Metro since SDK 52 ([monorepo guide](https://docs.expo.dev/guides/monorepos/)).
- Rejected: **pnpm** (isolated installs still break some RN libs; docs recommend `nodeLinker: hoisted` fallback — same guide), **Turborepo** (caching layer you don't need at 2 apps; add later if CI is slow).
- Share exactly one thing: **generated types from the NestJS OpenAPI JSON** with `openapi-typescript` ([site](https://openapi-ts.dev/)) into `packages/api-types` — same generator the web dashboard already chose (see `02-frontend-react.md`), so both apps typecheck against one contract. No shared runtime/UI code yet.
- Metro caveats handled automatically since SDK 52 (watchFolders etc.); the one thing to police: **never allow duplicate `react`/`react-native` versions** in the tree (`npm why react-native` — same guide). If Metro resolves fail, escape hatch is `nodeLinker: hoisted` / resolutions per the guide.

## 5. API base URL & LAN realities

- Config: `EXPO_PUBLIC_API_URL` via `.env` / `.env.local` (gitignored), inlined at build time; must be a static `process.env.EXPO_PUBLIC_API_URL` reference ([env docs](https://docs.expo.dev/guides/environment-variables/)). Three profiles: emulator (`http://localhost:3000` iOS sim / `http://10.0.2.2:3000` Android emulator), LAN dev (laptop's DHCP IP in `.env.local`), VPS prod (`https://…`).
- Pitfalls: laptop IP changes on new networks (document `ipconfig getifaddr en0` in README); phone and laptop must share a network (guest Wi-Fi isolation blocks it).
- Cleartext HTTP: Android 9+ blocks it by default — set `android.usesCleartextTraffic` via `expo-build-properties` ([docs](https://docs.expo.dev/versions/latest/sdk/build-properties/)); iOS needs `NSAllowsLocalNetworking` ATS exception + the iOS 14+ local-network permission (Info.plist key above). Both are dev-build/prebuild config — no code.
- HTTPS on LAN when wanted: `mkcert` to make a locally-trusted cert for the laptop hostname and load it in NestJS ([repo](https://github.com/FiloSottile/mkcert)); install the mkcert CA on the test phone. Alternative: skip and wait for the VPS's real certificate. Don't buy a domain for the LAN phase.

## 6. Testing, lint, CI (tiny but real)

- **Jest + jest-expo preset + React Native Testing Library** — Expo's official unit-testing guide ([docs](https://docs.expo.dev/develop/unit-testing/)); RN's own testing guide recommends the same stack ([reactnative.dev](https://reactnative.dev/docs/testing-overview), [RNTL](https://testing-library.com/react-native/)). Test the events-list screen and the API-client wrapper; skip E2E (Detox) for a scaffold.
- Lint/format: the template ships ESLint flat config; extend `eslint-config-expo` and reuse the web app's Prettier config from the workspace root ([ESLint docs](https://docs.expo.dev/guides/using-eslint/)).
- CI: one GitHub Actions job running `lint`, `tsc --noEmit`, `jest` on every PR — no macOS runner needed. Native builds only on demand: `eas build` on EAS's free tier (**15 Android + 15 iOS builds included**, [pricing](https://expo.dev/pricing)) or fully local `npx expo run:android`/`run:ios`. Add EAS CI builds only when a real iOS demo is scheduled.

## 7. Honest verdict

Scaffold it now, but tiny: **Expo SDK 57 default template in `apps/mobile` with Expo Router, one placeholder "Events" screen wired to the shared `packages/api-types` client, `.env` profiles, ESLint/Jest green, and a README that boots emulator + Android dev build — ~4–6 h, one commit.** Anything beyond that (push, auth screens, offline cache, EAS accounts) is speculative work on a feature explicitly outside the MVP, and Expo's 2026 friction (Expo Go store lag, dev-build requirement for push) means real device demos cost a build cycle each time — that cost is better paid when the backend flow it demonstrates actually exists. The API contract is the only thing mobile must not drift from, and generating types from the OpenAPI JSON protects it for ~1 h. If even the 4–6 h scaffold slips past MVP week, the fallback is a documented placeholder (this file) plus the Telegram bot for notifications, which delivers the user-visible value with zero mobile code.

## Recommended decisions

| Decision | Choice | Why | Risk |
|---|---|---|---|
| Framework | Expo SDK 57 + React Native + TypeScript (confirmed) | Only native option reusing TS/React knowledge; shared API types; free push path | — |
| Rejected: Flutter | — | New language, zero sharing with web stack | — |
| Rejected: PWA as "the app" | Keep as fallback only | iOS push needs Home-Screen install + HTTPS; no real app artifact | Fine if push expectations drop |
| Scaffold timing | Now, capped at ~4–6 h (one screen + config + tests) | Locks stack decisions cheaply; MVP stays the priority | Scope creep — defer push/auth/offline |
| Template/router | `create-expo-app` default (Expo Router, `/src/app`) | Official default, file-based, deep-linkable | Expo Go on stores lags — use emulator/dev builds for demo |
| New Architecture | Default, no config | Only option since SDK 55 | — |
| Repo layout | npm workspaces + `packages/api-types` (openapi-typescript from NestJS OpenAPI) | Same generator as web app; no pnpm/Turbo overhead | Duplicate-dep Metro issues — run `npm why react-native` when confused |
| Notifications now | Telegram bot in NestJS (backend-only, ~2–3 h) | Works today, no app/store/credentials needed | Not an "app notification"; acceptable for MVP |
| Notifications later | Expo Push Service via dev build + EAS projectId | Free, one HTTP API, wraps FCM/APNs | Requires dev build (gone from Expo Go since SDK 53) |
| LAN API access | `EXPO_PUBLIC_API_URL` per env; Android cleartext flag + iOS `NSAllowsLocalNetworking` | Documented, prebuild-only config | iOS local-network permission prompt confuses users — note in README |
| iOS physical demo | Defer until needed ($99 Apple account) | TestFlight/ad-hoc both need paid membership | None for MVP (emulator suffices) |
| CI | GH Actions: lint + tsc + jest; EAS builds on demand | Free, no macOS runner | Native build issues surface late — acceptable |
