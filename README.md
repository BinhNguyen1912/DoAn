# Safe Zone Monitor

Đồ án nguyên mẫu giám sát một vùng nguy hiểm bằng webcam và Edge AI trên laptop; backend lưu Sự kiện, dashboard hiển thị. Mục tiêu giai đoạn IoT là ESP32 phát câu cảnh báo tiếng Việt ghi sẵn. Đây là nguyên mẫu học thuật, không phải thiết bị bảo vệ trẻ em được chứng nhận.

> **Phạm vi đề tài cần giảng viên xác nhận:** mô tả ban đầu về bám bắt mục tiêu bằng segmentation/temporal propagation khác với Safe Zone Monitor hiện tại (YOLO person + ByteTrack + kiểm tra đa giác). Xem `docs/tong-quan-de-tai.md` mục 10.

## Cấu trúc và trạng thái

| Đường dẫn | Vai trò | Trạng thái |
| --- | --- | --- |
| `apps/edge-ai/` | Webcam, YOLO person + ByteTrack, kiểm tra vùng, máy trạng thái, gửi Sự kiện | Pipeline phần mềm đã có; FPS/độ chính xác cần đo đầy đủ |
| `apps/backend/` | NestJS API, PostgreSQL, vùng/thiết bị/sự kiện | API và schema đã có; alert orchestration/ACK chưa hoàn thiện |
| `apps/web/` | React dashboard, vùng, thiết bị, lịch sử | Dashboard có mock và real API mode; Zone editor chưa có |
| `apps/mobile/` | App điện thoại nếu mở rộng sau MVP | Chỗ dành sẵn |
| `iot/esp32-alert/` | Firmware cảnh báo riêng | Khung thư mục; firmware chưa viết |
| `iot/xiaozhi-source/` | Source Xiaozhi gốc để tham khảo | Chỉ tham khảo, không sửa |
| `docs/` | Phương án, kiến trúc, API, roadmap, báo cáo | Tài liệu dự án |
| `evaluation/` | Số đo, dữ liệu thử và nhãn | Có ghi nhận benchmark CPU ban đầu; đánh giá A/B/C còn tiếp tục |

## Chạy phần mềm trên Windows

Tại gốc repo `D:\DoAn`, mở các terminal riêng:

```powershell
docker compose up -d db
npm run backend:dev
npm run web:dev
npm run edge:run
```

- `npm run edge:fake` gửi một Sự kiện giả để kiểm tra kết nối Edge client → backend; nó không mở webcam.
- `npm run cam:probe` kiểm tra chỉ số webcam.
- `npm run dev` là launcher gộp mới; nghiệm thu full startup trên Windows trước khi phụ thuộc vào nó.
- Web xem dữ liệu thật khi `apps/web/.env` có `VITE_USE_MOCK=false`; sau khi đổi `.env` cần restart Vite.

## Nguyên tắc

- Khung hình xử lý cục bộ trên laptop; không gửi ảnh/video lên dịch vụ AI cloud.
- ESP32 firmware cảnh báo viết riêng trong `iot/esp32-alert/`. Không nạp nguyên firmware Xiaozhi `.bin`; chỉ tham khảo sau khi kiểm tra bo mạch thật.
- Không commit `.env`, token, model, clip hay dữ liệu có người tham gia. Chỉ commit `.env.example`.
- Không ghi số FPS/độ trễ/báo nhầm chưa đo. Xem `docs/tong-quan-de-tai.md` để hiểu bài toán và trạng thái các phần.

## Tài liệu

- `docs/phuonganlam.md` — phương án kỹ thuật gốc và linh kiện dự kiến.
- `docs/tong-quan-de-tai.md` — lý thuyết, kiến trúc, trạng thái, giới hạn và hướng mở rộng.
- `docs/roadmap.md` — lộ trình Phase A/B/C.
- `docs/api-contract.md`, `docs/openapi.json` — API.
- `docs/bao-cao-tien-do-tuan.md` — bản làm việc cho báo cáo tiến độ; không commit nếu còn thông tin cá nhân.
