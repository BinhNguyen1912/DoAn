# Tuần 4 — Backend

- [ ] Khởi tạo NestJS, kết nối PostgreSQL, cấu hình qua biến môi trường
- [ ] Viết `docs/api-contract.md` đầy đủ: JSON schema, mã lỗi, timeout, xác thực LAN, chống trùng `event_id`
- [ ] Schema: `zone`, `device`, `event`, `alert_attempt`
- [ ] Module `zones`, `events`, `devices` với validate DTO
- [ ] `POST /api/events` nhận sự kiện từ Edge AI; trùng `event_id` thì không tạo mới
- [ ] `GET /api/events`, `GET/PUT /api/zones`, `GET /api/devices`
- [ ] `api_client.py` gửi sự kiện thật vào backend
- [ ] Tách một "kênh thông báo" (interface) để sau cắm Telegram; chưa cài đặt kênh nào ngoài loa
