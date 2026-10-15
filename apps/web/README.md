# Web dashboard

React + Vite + Tailwind v4 + TanStack Query + openapi-fetch. Hiển thị vùng cảnh báo (đa giác trên canvas), trạng thái loa ESP32, tổng quan và lịch sử sự kiện xâm nhập kèm kết quả từng lần phát cảnh báo.

## Chạy

```bash
npm run web:dev      # Vite dev server, http://localhost:5173, proxy /api -> backend
npm run web:build    # tsc -b && vite build
npm run web:lint     # oxlint
```

## Chế độ xem trước (mock)

`.env.example` mặc định `VITE_USE_MOCK=true` để xem giao diện không cần backend/DB. Khi backend sẵn sàng, đặt `VITE_USE_MOCK=false` trong `.env` rồi khởi động lại `npm run web:dev`; Vite proxy `/api` về `VITE_DEV_PROXY_TARGET` (mặc định `http://127.0.0.1:3000`).

## Nguồn kiểu

Kiểu API lấy từ `@safe-zone/api-types` (sinh từ `docs/openapi.json`). Đổi controller/DTO ở backend thì chạy `npm run api:generate` rồi type trên web tự cập nhật.

## Cấu trúc

- `src/api/` — client openapi-fetch, lớp mock, hàm truy xuất (`listZones/listDevices/listEvents`)
- `src/hooks/` — `useZones`, `useDevices` (poll), `useEvents` (poll)
- `src/components/` — `Header`, `ZoneCanvas`, `DeviceCard`, `EventsTable`, `AlertStatusBadge`, `StatusPill`
- `src/utils/format.ts` — định dạng tiếng Việt (thời gian, độ tin cậy)

Chưa có bộ test UI riêng; `web:test` chưa được cấu hình.