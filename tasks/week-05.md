# Tuần 5 — Tích hợp

- [ ] Firmware: `POST /alert` nhận `event_id`, `audio_id`; bỏ qua lệnh trùng
- [ ] Firmware trả các trạng thái: đã nhận, bắt đầu phát, phát xong, lỗi
- [ ] Backend module `alerts`: gọi ESP32, timeout, ghi từng bước vào `alert_attempt`
- [ ] Heartbeat/`GET /health` để biết ESP32 online hay offline
- [ ] Không coi HTTP gửi thành công là loa đã phát
- [ ] Kiểm tra chống báo lặp end-to-end: đứng lâu, ra rồi vào lại
- [ ] Ảnh sự kiện (tùy chọn, tắt mặc định): Edge AI gửi JPEG kèm sự kiện, backend lưu file trên laptop, DB giữ đường dẫn, tự xoá sau 7 ngày
- [ ] Rà `GLOSSARY.md` cho khớp với mã đã viết

**Cổng chốt:** một sự kiện đi trọn từ webcam tới loa và xuất hiện trong database. Sau đó mới làm đẹp dashboard.
