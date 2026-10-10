# Hợp đồng API dự kiến

Các route dưới đây là đề xuất để các phần viết đồng bộ; chưa được triển khai.

- Edge AI → backend: `POST /api/events` với `event_id`, `zone_id`, `detected_at`, `confidence`.
- Backend → ESP32: `POST /alert` với `event_id`, `audio_id`.
- Backend → web/mobile: `GET /api/events`, `GET /api/zones`, `PUT /api/zones/:id`, `GET /api/devices`.
- ESP32: `GET /health` để kiểm tra kết nối.

Khi triển khai, xác định JSON schema, mã lỗi, timeout, xác thực LAN, ACK sau khi phát và cách chống xử lý trùng `event_id`.
