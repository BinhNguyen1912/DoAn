# Kế hoạch 8 tuần

Mỗi tuần một file. Việc ở đây ghi ở mức thô; bóc tách thành việc nhỏ khi bắt đầu làm tuần đó. Tick `[x]` khi xong. Nguồn: `docs/phuonganlam.md` mục 6.

| Tuần | Trọng tâm | Kết quả cần thấy | Cổng chốt |
| :-: | --- | --- | --- |
| [1](week-01.md) | Nền tảng | Đo webcam, FPS, model; chốt vị trí camera và vùng; đặt linh kiện | |
| [2](week-02.md) | Phần cứng | ESP32 tự phát một WAV qua loa | Chưa rõ tiếng thì dừng tích hợp |
| [3](week-03.md) | Edge AI | Phát hiện người, tracking, kiểm tra đa giác; video overlay | |
| [4](week-04.md) | Backend | NestJS + PostgreSQL; Edge AI gửi sự kiện, backend lưu | |
| [5](week-05.md) | Tích hợp | Backend gọi ESP32, ACK, chống trùng, chống báo lặp | Một sự kiện đi trọn webcam → loa → DB |
| [6](week-06.md) | Dashboard | Chỉnh vùng, xem sự kiện, trạng thái thiết bị, ảnh tùy chọn | |
| [7](week-07.md) | Đánh giá | Dữ liệu thử có nhãn, so sánh cấu hình A, B, C | |
| [8](week-08.md) | Hoàn thiện | Demo, thử lỗi mạng và thiếu sáng, báo cáo, video | |

## Quyết định đã chốt (chưa phải ADR)

- Khung hình chỉ xử lý trong RAM trên laptop; không gửi lên cloud, R2 hay Drive.
- Ảnh minh chứng: tắt mặc định, bật bằng cấu hình, chỉ lưu khi có sự kiện.
- Edge AI gửi ảnh JPEG kèm sự kiện (multipart) tới backend; backend lưu file vào thư mục trên laptop, DB chỉ giữ đường dẫn. Edge AI không giữ trạng thái lưu trữ.
- Giữ ảnh 7 ngày, backend tự xoá khi quá hạn. Clip thử trong `evaluation/` xoá thủ công sau khi nộp.
- Điện thoại/Telegram không làm trong MVP; backend tách "kênh thông báo" để cắm thêm sau. Mặc định chỉ gửi văn bản; gửi ảnh ra ngoài phải bật chủ động và chỉ với người tình nguyện đồng ý.
- Thuật ngữ thống nhất: xem `../GLOSSARY.md`.
- Ngưỡng ban đầu cần đo lại: `conf=0.35`, 3 khung liên tiếp, `imgsz=640`.

## Cắt giảm nếu trễ tiến độ (theo thứ tự cắt trước)

1. Ảnh minh chứng.
2. Chỉnh vùng trên dashboard: dùng file cấu hình thay thế.
3. Trang thống kê trên dashboard.
Không cắt: máy trạng thái chống lặp, ACK từ ESP32, thực nghiệm so sánh A/B/C.
