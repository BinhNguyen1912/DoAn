# Kiến trúc

Webcam → Edge AI (laptop) → `POST /api/events` → Backend NestJS + PostgreSQL → lệnh tới ESP32 → ESP32 phát câu ghi sẵn → ACK về backend → Dashboard.

Model chỉ nhận diện lớp `person`, không xác định tuổi. Phương án gốc: `phuonganlam.md`.

> Nguồn của các quyết định dưới đây là 5 báo cáo trong `docs/research/` (01 backend, 02 web, 03 mobile, 04a monorepo và hợp đồng, 04b docker/CI/triển khai), kiểm tra phiên bản ngày 10/10/2026. **Trạng thái: đề xuất, người dùng chưa duyệt từng mục**, trừ mục 5 (đã chốt).

## 1. Công nghệ

| Phần | Chọn | Ghi chú |
| --- | --- | --- |
| Backend | NestJS 12.1, Node 24 LTS, TypeScript 6 | NestJS 12 yêu cầu TS 6; chưa dùng TS 7 |
| CSDL | PostgreSQL 18, TypeORM 1.1 (đã chốt dùng TypeORM) | `synchronize:false`, migration phải review. TypeORM 1.x mới ra, ghim đúng phiên bản |
| Web | React 19, Vite 8, TS 6, TanStack Query v5, React Router v8, Tailwind v4 | Vùng vẽ bằng SVG tự viết, toạ độ chuẩn hoá 0..1 |
| Mobile | Expo SDK 57 (React Native, Expo Router) | Chỉ dựng khung giới hạn 4–6 giờ; demo bằng emulator hoặc APK dev-build |
| Edge AI | Python 3.12 quản lý bằng `uv`, chạy trực tiếp trên máy (không Docker) | Python hệ thống 3.9 đã hết hạn, không dùng |
| Firmware | Arduino-ESP32 | Hợp đồng viết tay ở `docs/esp32-api.md` |

## 2. Cấu trúc repo

```
apps/backend  apps/web  apps/mobile   (npm workspaces)
apps/edge-ai                          (uv, tách khỏi npm)
packages/api-types                    (sinh từ OpenAPI)
iot/esp32-alert  iot/xiaozhi-source
docs/openapi.json                     (hợp đồng chính, commit vào repo)
```

- npm workspaces, không dùng pnpm hay Turborepo. Khai báo đầy đủ dependency của từng app vì hoisting che lỗi thiếu dependency; không để trùng `react`/`react-native`.
- **Hợp đồng API:** NestJS (`@nestjs/swagger`) sinh `docs/openapi.json`. CI so khớp (`git diff --exit-code`). Web và mobile sinh kiểu bằng `openapi-typescript`; edge-ai sinh pydantic bằng `datamodel-code-generator`.
- Hợp đồng ESP32 không nằm trong OpenAPI vì backend là bên gọi, không phải bên phục vụ.

## 3. Backend

- Module: `zones`, `events`, `devices`, `alerts`, `notifications` (kênh thông báo). Controller → service → repository.
- `POST /api/events` idempotent theo `event_id` (unique). Ảnh minh chứng: multipart, Multer ghi đĩa, tên file do server đặt, DB giữ đường dẫn, cron xoá sau 7 ngày.
- **Gửi lệnh tới ESP32 bằng bảng trạng thái trong DB** (`alert_attempt`) cộng bộ quét `@nestjs/schedule`: `sent → received → playing → done | failed`, có timeout và retry. HTTP 200 chỉ có nghĩa là `received`. Không dùng Redis/BullMQ.
- Cấu hình bằng `@nestjs/config` + Zod, thiếu biến thì dừng ngay. DTO dùng class-validator. Có `/health` và `/ready`, throttler, CORS, helmet, log có request id.
- Xác thực: bearer token tĩnh cho edge-ai và ESP32 (LAN); web dùng nginx Basic auth; JWT để sau.
- Đồng hồ: lưu `received_at` ở server; ESP32 đo độ trễ bằng hiệu cùng đồng hồ và chỉ tin khi SNTP đã đồng bộ.

## 4. Triển khai

- `compose.yaml` + override cho dev + `compose.prod.yaml`: `db`, `api`, `web` (nginx). **Không mở cổng db ra máy chủ** (cổng 5432 trên máy này đã bị một container khác chiếm).
- Ảnh sự kiện ở named volume; cần sao lưu định kỳ vì `docker compose down -v` sẽ xoá hết.
- Hiện chạy trong LAN. Có VPS sau thì dùng Caddy cho HTTPS.
- CI GitHub Actions lọc theo đường dẫn: lint, typecheck, test, build, kiểm tra drift OpenAPI, gitleaks (repo public), ruff + pytest cho Python, biên dịch firmware bằng `arduino-cli`.
- Git: conventional commits (husky + commitlint ở commit-msg), bảo vệ nhánh `main` bằng PR. Phần này người dùng sẽ tự thiết lập (xem `AGENTS.md` mục 9b).

## 5. Quyết định của người dùng (đã chốt 10/10/2026)

1. **Backend → ESP32: push** (`POST /alert`). Nếu sau này backend lên VPS và ESP32 nằm sau NAT thì mới xét lại sang pull.
2. **Telegram: để sau MVP.** Chỉ có interface kênh thông báo.
3. **Mobile: chỉ giữ placeholder** đến sau MVP; không dựng khung Expo bây giờ. Bước 7 bên dưới bị hoãn.
4. **Máy demo cuối: máy Windows ở nhà.** Edge AI, webcam và ESP32 phải chạy được trên Windows; số đo FPS và độ trễ đo trên máy này. Script của dự án ưu tiên Node hoặc Python, tránh `.sh`.

## 6. Thứ tự dựng (mỗi bước kiểm tra được)

1. Gốc monorepo: `package.json` workspaces, `.editorconfig`, `.nvmrc`, `.gitignore` bổ sung.
2. Backend: `nest new`, ghim phiên bản, Zod config, `/health`, test chạy được.
3. Backend: TypeORM + migration đầu tiên (`zone`, `device`, `event`, `alert_attempt`) + Postgres qua compose.
4. Backend: Swagger sinh `docs/openapi.json` và script kiểm tra drift.
5. `packages/api-types` sinh kiểu từ OpenAPI.
6. Web: `create vite`, proxy `/api`, một trang gọi `/api/devices` qua API client đã sinh.
7. ~~Mobile~~ (hoãn đến sau MVP).
8. CI + gitleaks.
9. Docker compose cho `db`, `api`, `web`.
