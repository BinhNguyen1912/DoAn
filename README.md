# Safe Zone Monitor

Thư mục tổng cho đồ án giám sát vùng nguy hiểm bằng webcam, Edge AI và ESP32 phát cảnh báo tiếng Việt.

## Cấu trúc

| Đường dẫn | Vai trò | Trạng thái |
| --- | --- | --- |
| `apps/edge-ai/` | Đọc webcam, phát hiện người, tracking, xét vùng, tạo sự kiện | Khung source |
| `apps/backend/` | NestJS API, PostgreSQL, điều phối lệnh ESP32 | Khung source |
| `apps/web/` | React dashboard, vùng cảnh báo, lịch sử | Khung source |
| `apps/mobile/` | Ứng dụng điện thoại nếu mở rộng sau MVP | Chỗ dành sẵn |
| `iot/esp32-alert/` | Firmware cảnh báo cục bộ cần viết cho đồ án | Khung source |
| `iot/xiaozhi-source/` | Source Xiaozhi gốc từ ZIP đã gửi | Mã tham khảo, chưa chỉnh sửa |
| `docs/` | Kiến trúc và hợp đồng API | Ghi chú ban đầu |
| `hardware/` | Sơ đồ nối dây, danh sách linh kiện | Chỗ dành sẵn |
| `evaluation/` | Clip, nhãn và kết quả đánh giá | Chỗ dành sẵn |

Phương án đã chốt: https://docs.google.com/document/d/1FprXMsuWw5_Uy6QIymV7EYPmksZGyVr5FPYUb-WJ0ag/edit

## Ranh giới triển khai

- `iot/xiaozhi-source/` là mã chatbot tham khảo. Không nạp nguyên firmware Xiaozhi `.bin` để làm thiết bị cảnh báo.
- `iot/esp32-alert/` sẽ là firmware riêng: nhận lệnh LAN, phát tệp WAV ghi sẵn qua MAX98357A, phản hồi trạng thái.
- AI chạy tại laptop với model phát hiện `person` đã huấn luyện sẵn. Không gửi từng khung hình lên cloud.
- Thư mục này mới là khung tổ chức và bản sao source tham khảo. Backend, web, mobile, AI và firmware cảnh báo chưa có ứng dụng chạy được.

## Nguồn tham khảo

Xiaozhi được lấy từ ZIP người dùng đã cung cấp; xem `iot/xiaozhi-source/README_en.md` và `iot/xiaozhi-source/LICENSE`. Giữ nguyên giấy phép và ghi nguồn khi sử dụng lại mã.
