# Lộ trình mở rộng (beyond MVP)

File này là bộ nhớ cho mọi agent về **phạm vi mở rộng** sau MVP. Quyết định ghi ở đây + `docs/architecture.md` §5. Đọc cùng `AGENTS.md` và `tasks/`.

> Cập nhật 14/10/2026 bởi người dùng. Trạng thái: **đề xuất đã chốt phạm vi**, chưa grill thành spec cho Phase C.

## Bối cảnh

MVP hiện tại (đã chạy phần mềm): webcam → edge-ai (detect person + ByteTrack + đa giác + máy trạng thái) → `POST /api/events` → backend NestJS + Postgres → web dashboard (poll). Phần cứng (ESP32 loa) chưa gắn.

Người dùng muốn mở rộng thành sản phẩm hoàn chỉnh hơn:
1. **Đa giác tùy setup tọa độ** — vẽ vùng theo vị trí mình muốn, không dùng hình mặc định.
2. **ESP32 gắn WiFi bằng quét mã QR** — provisioning WiFi cho ESP32 qua app.
3. **Mọi thông báo đẩy về app mobile** — mobile app nhận push khi có sự kiện.

## Phân giai đoạn (tránh làm dở cùng lúc)

### Phase A — phần mềm còn lại (bây giờ, KHÔNG cần hardware)

- **Zone editor trên web** (xem chi tiết dưới): vẽ đa giác trên ảnh chụp từ webcam, lưu `PUT /api/zones/:id`.
- Module `alerts` + `notifications` (seam kênh thông báo): cột "Lần phát cảnh báo" hiện thật; sẵn chỗ cắm ESP32/Telegram/MQTT sau.
- Đo FPS/độ trễ thật trên laptop → `evaluation/`.
- Thống kê so sánh A/B/C.

### Phase B — IoT (sau khi mua đồ, trong MVP)

- Firmware ESP32: phát WAV từ flash qua MAX98357A, `GET /health`, nhận `POST /alert`, 5 trạng thái ACK (`sent→received→playing→done|failed`), heartbeat.
- Backend `Esp32HttpChannel` thay `LoggingChannel` trong seam `notifications`.

### Phase C — mở rộng SAU MVP (lớn, cần grill thành spec riêng trước khi code)

- **ESP32 WiFi provisioning bằng QR**: ESP32 softAP + captive portal; app mobile quét QR chứa SSID/password (hoặc token provisioning) → ESP32 join WiFi. Cân nhắc SmartConfig / BLE provisioning thay QR nếu đơn giản hơn.
- **App mobile thật** (hiện chỉ placeholder, decision §5.3): Expo + Expo Router. Cần dev-build cho push.
- **Push notification**: Expo Push Service (cần HTTPS/VPS cho server). Backend `notifications` seam thêm kênh `MobilePushChannel`.
- **Đẩy mọi thông báo về mobile**: mọi sự kiện/cảnh báo/thiết bị offline đều push.

> Phase C vượt MVP đáng kể. Đóng MVP (A+B) trước; Phase C sang tuần 8 hoặc sau bảo vệ nếu còn thời gian.

## Quyết định đã ghi

- **Zone editor KHÔNG cắt.** AGENTS.md §5 cũ đặt "chỉnh vùng trên dashboard" vào danh sách cắt — người dùng yêu cầu giữ. Đã sửa AGENTS.md §5.
- **Giao tiếp vẫn HTTP** (không MCP, không MQTT trong MVP). MQTT chỉ thêm khi backend lên VPS + ESP32 sau NAT / nhiều loa, qua seam `notifications` (xem `docs/research/04b-docker-ci-deploy.md`).
- **Mobile + push + WiFi QR provisioning: hoãn sau MVP** (decision §5.3 giữ nguyên).

## Spec Zone editor (Phase A)

**Mục tiêu:** người dùng tự vẽ đa giác vùng nguy hiểm trên ảnh tham chiếu từ webcam thật, lưu vào backend; edge-ai và web đều dùng vùng đó.

**Cách làm:**
- `npm run edge:snapshot` (edge-ai): chụp 1 khung, `POST /api/zones/:id/snapshot` (multipart) → backend lưu ảnh tham chiếu vào `EVIDENCE_DIR` (hoặc thư mục riêng), DB lưu đường dẫn. Ảnh **chỉ trên laptop**, không cloud.
- Web: component `ZoneEditor` — hiện ảnh tham chiếu làm nền, thêm/xóa/kéo đỉnh đa giác (canvas), nút "Lưu vùng" → `PUT /api/zones/:id` với mảng điểm chuẩn hóa 0..1.
- Ảnh tham chiếu **tùy chọn**: không có thì vẽ trên canvas 16:9 trống. Tọa độ luôn chuẩn hóa 0..1, lưu DB, độc lập độ phân giải.
- Backend đã có `PUT /api/zones/:id` và `ZonePointDto`; chỉ cần thêm endpoint snapshot + trường lưu đường dẫn ảnh (hoặc tách bảng `zone_snapshot`).

**Thành phần ảnh hưởng:** edge-ai (thêm snapshot), backend (endpoint snapshot), web (ZoneEditor). Đổi route phải cập nhật `docs/api-contract.md`.