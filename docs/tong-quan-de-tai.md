# Tổng quan đề tài: từ bài toán đến hướng mở rộng

> Tài liệu giúp sinh viên hiểu và trình bày đồ án với giảng viên: bài toán, lý thuyết nền, luồng hoạt động, lý do chọn công nghệ, trạng thái triển khai và hướng mở rộng. Cập nhật 15/10/2026. Đây là tài liệu giải thích, **không thay thế** quyết định chính thức của giảng viên.
>
> **Điểm cần chốt trước khi mở rộng:** mô tả đề tài ban đầu giảng viên đưa là bám bắt mục tiêu bằng phân đoạn và lan truyền theo thời gian; sản phẩm đang triển khai là phát hiện người xâm nhập vùng nguy hiểm. Hai bài toán có liên quan nhưng không đồng nhất. Xem mục 10.

## 1. Tóm tắt trong một phút

Đồ án hiện hướng tới một hệ thống giám sát **một vùng nguy hiểm được cấu hình trước**. Webcam nối với laptop; mô hình AI phát hiện người trực tiếp trên laptop. Phần mềm kiểm tra vị trí người so với đa giác vùng nguy hiểm. Nếu người nằm trong vùng đủ số khung hình liên tiếp, Edge AI gửi một sự kiện qua mạng nội bộ đến backend. Backend lưu sự kiện vào PostgreSQL; dashboard web đọc và hiển thị lịch sử. Ở giai đoạn IoT, backend sẽ gửi lệnh đến ESP32 để phát một câu cảnh báo tiếng Việt đã ghi âm sẵn, rồi cập nhật trạng thái thiết bị.

Điểm quan trọng là **AI suy luận tại laptop, không gửi từng khung hình lên dịch vụ AI đám mây**. Ảnh không phải đi qua Internet để nhận diện. Tuy nhiên, bản hiện tại chưa có firmware ESP32 hoàn chỉnh; luồng cảnh báo bằng loa là phần sẽ làm sau khi mua và kiểm tra phần cứng.

## 2. Bài toán và giá trị của sản phẩm

### Bài toán

Trong một khu vực mô phỏng (ví dụ lối đi, cửa ra vào hoặc khu vực cần tránh), cần biết có người đi vào vùng được đánh dấu hay không, ghi nhận thời điểm và hạn chế cảnh báo lặp khi mô hình nhận diện chập chờn hoặc người đứng lâu.

### Sản phẩm hiện giải quyết

- Nhận diện **người** trong hình ảnh webcam.
- Theo dõi ID tạm thời của các người được phát hiện qua các khung hình.
- Kiểm tra một điểm đại diện vị trí đứng của người với đa giác vùng nguy hiểm.
- Xác nhận qua nhiều khung hình trước khi tạo một sự kiện.
- Gửi và lưu sự kiện để xem lại trên dashboard.
- Mục tiêu giai đoạn IoT: phát câu cảnh báo ghi sẵn từ loa ESP32 và lưu riêng trạng thái gửi/nhận/phát/lỗi.

### Không tuyên bố

- Không xác định tuổi, danh tính hay quan hệ của người.
- Không phải thiết bị bảo vệ trẻ em được chứng nhận hoặc hệ thống an toàn sinh mạng.
- Không đo khoảng cách vật lý chỉ từ một camera RGB; vùng trên ảnh là vị trí tương đối trong khung hình.
- Chưa chứng minh độ chính xác, FPS hay độ trễ bằng thực nghiệm chính thức. Các số này phải đo trên máy và dữ liệu thật.

## 3. Lý thuyết nền, bằng ngôn ngữ dễ trình bày

### 3.1 Phát hiện đối tượng (Object Detection)

Mô hình nhận một khung hình và trả về các hộp bao (bounding boxes), nhãn lớp và độ tin cậy. Ví dụ: `person`, tọa độ hộp `(x1, y1, x2, y2)`, confidence `0.82`. Confidence là mức tin cậy của mô hình, **không phải** xác suất chắc chắn đúng.

Trong bản code hiện tại, Ultralytics YOLO dùng lớp `person` (class 0 trong model hiện dùng). Model/weight trong code là `apps/edge-ai/models/yolo11n.pt`. Tài liệu phương án cũ có chỗ ghi `yolo26n.pt`; cần thống nhất tên model trong tài liệu và cấu hình sau khi chốt model cuối.

### 3.2 Theo dõi nhiều đối tượng (Multi-object tracking)

Detection tìm lại các đối tượng trên từng khung hình độc lập; tracking cố gắng nối các hộp qua thời gian và gán `track_id`. Bản hiện tại dùng ByteTrack thông qua Ultralytics `model.track(..., persist=True, tracker="bytetrack.yaml")`.

Tracking giúp hệ thống biết các khung hình liên tiếp có thể thuộc cùng một người. Nó có thể mất ID hoặc đổi ID khi bị che khuất lâu, người ra khỏi khung hoặc có nhiều người gần nhau. **ByteTrack là tracking dựa trên hộp phát hiện; nó không tạo mask phân đoạn.**

### 3.3 Phân đoạn ảnh (Image Segmentation)

Segmentation gán nhãn ở mức pixel, tạo mask theo hình dạng đối tượng. Mask bám sát đường viền hơn hộp chữ nhật. Bản edge-ai hiện tại **chưa dùng segmentation**.

### 3.4 Vùng đa giác và tọa độ chuẩn hóa

Vùng nguy hiểm được lưu bằng các đỉnh `(x,y)` chuẩn hóa trong khoảng 0..1. Ví dụ `x=0.5` là giữa chiều ngang, `y=0.8` là 80% chiều cao khung. Khi đổi kích thước ảnh, tọa độ được nhân với chiều rộng/cao mới để ra pixel.

Với người được phát hiện, chương trình lấy **điểm giữa cạnh đáy hộp bao** làm điểm kiểm tra (xấp xỉ vị trí chân). `cv2.pointPolygonTest` xác định điểm nằm trong, ngoài hay trên biên đa giác. Vì thế đưa **mặt** vào vùng đỏ không nhất thiết được tính là xâm nhập: điểm kiểm tra là đáy hộp, không phải khuôn mặt.

Tọa độ đa giác có trong backend và được Edge AI lấy khi khởi động. Web hiện có phần **hiển thị** vùng; giao diện để người dùng tự kéo/vẽ/lưu đa giác (Zone editor) **chưa được xây xong**.

### 3.5 Máy trạng thái và chống báo lặp

Mỗi track đi qua các trạng thái:

```text
OUTSIDE → CANDIDATE → ALERTED → EXITED → (có thể vào lại)
```

- `OUTSIDE`: điểm người ở ngoài vùng.
- `CANDIDATE`: điểm ở trong vùng nhưng chưa đủ số khung xác nhận.
- `ALERTED`: đã xác nhận và tạo sự kiện cho lần vào này.
- `EXITED`: trước đó ở trong vùng, nay đã ra; lần vào sau có thể được tính mới.

Cấu hình khởi đầu là 3 khung liên tiếp và cooldown 10 giây; đây là **tham số khởi đầu cần đánh giá**, chưa phải ngưỡng tối ưu. Nếu gửi lại cùng `eventId`, backend dùng khóa duy nhất để tránh lưu trùng (idempotency).

### 3.6 Edge AI (AI biên)

Edge AI là chạy suy luận AI ngay trên thiết bị gần nguồn dữ liệu thay vì gửi dữ liệu đến cloud để AI xử lý. Trong đồ án, laptop là thiết bị biên chạy model; webcam đọc khung hình vào RAM trên laptop. Backend/PostgreSQL/web có thể cùng chạy trên laptop hoặc trong LAN.

Để chứng minh đúng nghĩa Edge AI, khi trình bày cần chỉ ra: model chạy cục bộ; luồng khung hình không gọi API nhận diện ảnh bên thứ ba; mạng chỉ truyền sự kiện nhỏ từ Edge AI đến backend nội bộ. Có thể tắt Internet sau khi các phần mềm/model đã được cài/tải, rồi kiểm tra suy luận vẫn chạy trong LAN. **Lưu ý:** tải model/cài thư viện ban đầu có thể cần Internet, nhưng đó không có nghĩa mỗi khung hình được gửi lên cloud.

### 3.7 REST/HTTP, MQTT và “API”

- REST/HTTP là giao tiếp request/response: Edge AI gửi `POST /api/events`; web lấy dữ liệu bằng `GET /api/events`.
- Các request trên là API của **chính backend đồ án trong LAN**, không phải API tính phí của nhà cung cấp AI.
- Hiện dự án không dùng MCP (Model Context Protocol). Giao tiếp đang dùng là HTTP/REST.
- MQTT là pub/sub qua broker, phù hợp hơn khi có nhiều thiết bị, kết nối thường trực, hoặc backend ở xa mà ESP32 nằm sau NAT. MQTT làm tăng thành phần phải triển khai (broker, cấu hình kết nối/bảo mật, xử lý reconnect).
- Với nguyên mẫu một laptop, một loa cùng LAN, HTTP dễ thử và đủ cho MVP. Chỉ thêm MQTT nếu yêu cầu thực tế (ví dụ triển khai từ xa, nhiều loa hoặc yêu cầu độ trễ/luồng sự kiện cao) chứng minh cần thiết.

## 4. Luồng hoạt động từ camera đến dashboard

### 4.1 Luồng phần mềm đang có

```text
Webcam
  → OpenCV đọc frame trên laptop
  → YOLO phát hiện person + ByteTrack gán track_id
  → lấy đáy hộp bao, đổi sang tọa độ chuẩn hóa
  → kiểm tra với đa giác bằng pointPolygonTest
  → máy trạng thái xác nhận nhiều frame, chống lặp
  → POST /api/events (eventId, zoneId, detectedAt, confidence)
  → NestJS kiểm tra dữ liệu/token, lưu PostgreSQL
  → web GET /api/events và hiển thị sự kiện
```

`edge:fake` là lệnh kiểm tra riêng: tạo một sự kiện giả có UUID rồi gửi backend; nó **không mở webcam và không chứng minh detector đã phát hiện người**. Lệnh `edge:run` mới chạy camera/model/zone/state machine.

### 4.2 Luồng IoT mục tiêu (chưa hoàn thành)

```text
Backend lưu sự kiện mới
  → tạo Lệnh cảnh báo / Lần phát
  → gửi HTTP trong LAN tới ESP32
  → ESP32 phát WAV từ flash qua MAX98357A và loa
  → ESP32 gửi ACK theo từng trạng thái
  → backend lưu trạng thái, dashboard hiển thị
```

Các trạng thái mong muốn: **đã gửi → đã nhận → bắt đầu phát → phát xong / thất bại**. HTTP request thành công chỉ chứng minh thiết bị nhận request, không chứng minh loa phát ra âm thanh.

**Trạng thái hiện tại:** backend đã có entity `alert_attempt` và kiểu trạng thái; service điều phối lệnh/ACK và firmware ESP32 thực sự chưa được triển khai. Vì vậy chưa được trình bày rằng loa đã chạy hay dashboard đã xác nhận phát.

## 5. Kiến trúc và lý do chọn từng phần

| Thành phần | Vai trò | Vì sao hợp với nguyên mẫu | Giới hạn hiện tại |
|---|---|---|---|
| Webcam USB + OpenCV | Đọc frame, vẽ vùng/hộp | Webcam đã có; dễ thay đổi vị trí/độ phân giải; khung hình ở laptop | Thiếu sáng, góc nhìn và che khuất ảnh hưởng kết quả |
| YOLO11n pretrained (code hiện tại) | Phát hiện person | Model pretrained dùng được ngay, không cần thu nhãn/train từ đầu; bản nano nhằm giảm tải CPU | FPS/độ chính xác thực trên máy chưa được chốt; license và model cần ghi nguồn |
| ByteTrack | Theo dõi ID qua frame | Giúp nối detection theo thời gian, hỗ trợ chống báo lặp; tích hợp sẵn qua Ultralytics | Không phải segmentation; có thể mất/đổi ID khi che khuất hoặc nhiều người |
| OpenCV polygon | Kiểm tra vùng | Nhẹ, trực quan, tọa độ 0..1 dùng ở nhiều độ phân giải | Điểm chân phụ thuộc chất lượng hộp; editor người dùng chưa có |
| Python + uv | Edge AI | Gần với hệ sinh thái OpenCV/Ultralytics; quản lý môi trường Python riêng | Cần cài model/dependencies; tối ưu hiệu năng phải đo |
| NestJS + TypeScript | API và quy tắc nghiệp vụ | Module hóa, DTO/validation, OpenAPI giúp hợp đồng rõ | Cần hoàn thiện alert orchestration, device ACK và tests tích hợp |
| PostgreSQL + TypeORM migrations | Lưu vùng, thiết bị, sự kiện, lần phát | Dữ liệu bền vững, unique eventId chống trùng; schema qua migration | Không nên lưu video trong DB; cần backup nếu triển khai lâu dài |
| React + Vite + TanStack Query | Dashboard | Dễ làm UI một trang; cache/poll dữ liệu backend | Hiện poll định kỳ, chưa realtime push; editor vùng chưa có |
| HTTP/REST nội bộ | Kết nối Edge→backend→web, sau này backend→ESP32 | Ít hạ tầng, dễ kiểm tra bằng curl/Swagger trong LAN | Nếu đi qua Internet/NAT hoặc tăng quy mô có thể cần pull/MQTT/gateway |
| ESP32 DevKit + MAX98357A + loa (đề xuất) | Phát lời cảnh báo | Thiết bị nhỏ, Wi-Fi và I2S, phù hợp phát file âm thanh ghi sẵn | Chưa mua/chưa kiểm tra bo mạch, chân I2S, nguồn, file WAV và âm lượng |

### Dùng pretrained hay tự huấn luyện?

MVP dùng pretrained vì đề tài không cần tạo model nhận diện từ đầu. Training from scratch cần bộ dữ liệu lớn, công gán nhãn và GPU; không phải trọng tâm nếu câu hỏi nghiên cứu là độ tin cậy của vùng/tracking/chống lặp. Chỉ cân nhắc fine-tune khi thực nghiệm cho thấy lỗi có hệ thống và có dữ liệu phù hợp. Không tuyên bố model tốt hơn nếu chưa đo trên dữ liệu của đồ án.

## 6. Triển khai và cách vận hành

### Demo LAN trên máy Windows

Cần chạy đồng thời:
1. PostgreSQL (Docker Compose).
2. Backend NestJS.
3. Web React/Vite.
4. Edge AI Python trên host để truy cập webcam và mở preview.
5. Giai đoạn IoT: ESP32 đã nạp firmware, cùng mạng Wi-Fi.

Lệnh thành phần hiện có, đều chạy từ thư mục gốc `D:\DoAn`; mỗi dịch vụ dài hạn mở ở **terminal riêng**:

- Khởi động database (chạy một lần): `docker compose up -d db`
- Terminal 1 — backend: `npm run backend:dev`
- Terminal 2 — web: `npm run web:dev`
- Terminal 3 — Edge AI: `npm run edge:run`

Edge AI cần camera rảnh. Web cần `VITE_USE_MOCK=false` và khởi động lại Vite sau khi đổi `.env`. `npm run edge:fake` kiểm tra riêng đường edge-client → backend mà không cần webcam.

**Lưu ý deploy:** Edge AI cần quyền truy cập camera và cửa sổ OpenCV, nên trong demo Windows chạy trực tiếp trên host là cách đơn giản nhất; không cần đưa AI lên cloud. Backend/DB/web có thể đóng gói sau khi cấu hình production được kiểm thử. Bản hiện tại hướng tới demo trong LAN, chưa phải dịch vụ Internet production.

## 7. Tình trạng: đã có, còn thiếu, chưa được chứng minh

### Đã có trong source

- Monorepo npm workspaces; backend NestJS, PostgreSQL migrations/seed, endpoints zones/events/devices.
- Web dashboard có chế độ mock và chế độ gọi API thật; zone canvas, device card, event list.
- Edge AI: cấu hình, webcam, YOLO+ByteTrack, đa giác, state machine, HTTP client, `main.py` ghép luồng.
- Unit tests cho cấu hình, zone và state machine.
- Lệnh `edge:fake` đã được chạy thành công theo người dùng: backend trả nhận sự kiện và lưu DB.

### Chưa xong / chưa chốt

- Zone editor tương tác: thêm/kéo/xóa đỉnh và lưu từ web.
- Luồng alerts thật: backend tạo `alert_attempt`, gửi lệnh, retry/timeout, cập nhật ACK.
- Firmware và mạch ESP32 phát WAV; linh kiện cần mua/kiểm tra trên bo mạch thật.
- App mobile, push notification, Wi-Fi provisioning bằng QR.
- Tên model cuối (tài liệu có `yolo26n.pt`, code hiện dùng `yolo11n.pt`) và khớp với yêu cầu chính thức của thầy.
- FPS, độ trễ, precision/recall, báo nhầm/bỏ sót: chưa có số đo chính thức; không tự điền số.
- Live camera trigger nên được nghiệm thu lại có log `ALERT fired` và event xuất hiện trên web/DB; sự kiện fake không thay thế phép thử này.

## 8. Đánh giá khoa học: cần đo gì và so sánh ra sao

Mục tiêu không phải chỉ quay một video cho thấy chạy được. Cần một phép thử lặp lại, có nhãn chuẩn (ground truth) và ghi rõ cách thử.

Phương án A/B/C hiện đề xuất:

- **A:** phát hiện người là ghi nhận/cảnh báo.
- **B:** thêm kiểm tra đa giác vùng.
- **C:** thêm tracking, nhiều khung liên tiếp, máy trạng thái/cooldown chống lặp.

Chạy cùng kịch bản/dữ liệu cho cả cấu hình; đo ít nhất:
- true positive / false positive / false negative ở mức sự kiện;
- precision, recall; số báo nhầm mỗi giờ và số sự kiện trùng;
- FPS hoặc thời gian xử lý mỗi frame;
- độ trễ từ lúc bước vào vùng đến lúc backend ghi sự kiện; sau khi có loa, đo riêng tới lúc phát bắt đầu;
- tình huống mép vùng, đứng lâu, đi ngang ngoài vùng, che khuất, nhiều người, thiếu sáng.

Số lượt mẫu (ví dụ 100 lượt) là kế hoạch khởi đầu, cần thầy góp ý về thiết kế thí nghiệm và cách gán nhãn. Ghi model/version, confidence, imgsz, camera, ánh sáng, máy, ngày đo để người khác lặp lại được.

## 9. Hướng mở rộng

### Ưu tiên để hoàn thiện MVP

1. **Chốt đề tài với thầy**: xác nhận Safe Zone Monitor hay hệ thống bám bắt mục tiêu, hay gộp hai hướng.
2. **Zone editor**: ảnh/canvas làm nền, tự vẽ đa giác, lưu normalized points qua `PUT /api/zones/:id`; Edge AI dùng cùng vùng.
3. **Alerts/ACK**: tạo `alert_attempt` và thiết kế adapter/kênh thông báo; khi có ESP32 thay kênh giả bằng HTTP thật.
4. **IoT cơ bản**: ESP32 Wi-Fi, phát WAV, nhận lệnh idempotent, ACK 5 trạng thái, heartbeat.
5. **Benchmark + A/B/C**: đo thật và ghi vào `evaluation/`; đây là bằng chứng thực nghiệm.

### Nếu mở rộng sau khi chốt với thầy

- **Bám bắt mục tiêu realtime từ webcam:** nếu chỉ cần track người, có thể thử YOLO segmentation + tracker; nếu phải chọn bất kỳ vật thể nào và bám mask, cần đánh giá mô hình segmentation/video tracking phù hợp. Không chốt FPS hoặc model trước khi benchmark trực tiếp trên laptop CPU. Đây là khác bài toán với detection person + ByteTrack hiện tại.
- **Nhiều vùng/nhiều camera/nhiều loa:** mở rộng schema và định tuyến cảnh báo; tăng tải, đồng bộ và giao diện cấu hình.
- **MQTT:** chỉ thêm nếu yêu cầu triển khai từ xa, nhiều thiết bị hoặc kết nối lâu dài chứng minh HTTP không còn phù hợp; cần broker và kế hoạch bảo mật.
- **App mobile + push:** app đăng ký thiết bị, nhận sự kiện/cảnh báo; cần xử lý token push, quyền người dùng, HTTPS và backend notification channel.
- **Wi-Fi provisioning QR cho ESP32:** onboarding dễ hơn, nhưng phải thiết kế cách nhập/chuyển Wi-Fi credentials an toàn; không đưa mật khẩu Wi-Fi công khai vào QR không bảo vệ.
- **Ảnh minh chứng:** tắt mặc định, bật có chủ đích, lưu cục bộ có thời hạn và xin đồng ý người tham gia.
- **Tối ưu inference:** thử imgsz thấp hơn, ONNX/OpenVINO/quantization nếu benchmark cho thấy CPU chưa đủ; chỉ giữ tối ưu nếu đo được lợi ích và không làm tăng bỏ sót quá mức.

## 10. Đề tài giảng viên giao ban đầu: điểm cần làm rõ

Mô tả người dùng đã cung cấp cho biết thầy từng yêu cầu: người dùng chọn mục tiêu ở khung đầu, hệ thống theo dõi mục tiêu qua video bằng **segmentation, motion memory, temporal propagation**, pretrained, chịu được thay đổi hình dạng/chuyển động nhanh/che khuất tạm thời.

Đề tài đó khác với source hiện tại:

| Yêu cầu mô tả ban đầu | Source Safe Zone Monitor hiện tại |
|---|---|
| Người dùng chọn một mục tiêu ở frame đầu | Chưa có chức năng click chọn mục tiêu |
| Bám đối tượng/mask qua các frame | YOLO phát hiện lớp person và ByteTrack nối track ID |
| Segmentation mask | Chưa có; dùng bounding box |
| Motion memory/temporal propagation theo đề bài | Có tracking theo thời gian, nhưng không nên tự nhận ByteTrack đáp ứng đầy đủ yêu cầu segmentation/propagation của thầy |
| Bài toán bám bắt tổng quát | Bài toán phát hiện người xâm nhập vùng |
| Cảnh báo loa/vùng nguy hiểm | Là ứng dụng của source hiện tại; không thấy trong mô tả đề tài ban đầu |

Mang câu hỏi này đi xác nhận thầy trước khi chọn thêm model hoặc mua phần cứng: **đề tài chính thức là bám bắt mục tiêu, Safe Zone Monitor, hay kết hợp (bám người realtime rồi cảnh báo khi vào vùng)? Mục tiêu được chọn là chỉ người hay bất kỳ đối tượng nào? Chạy realtime CPU có yêu cầu FPS tối thiểu không?**

Không nên tự khẳng định source hiện tại đã đáp ứng đề tài tracking segmentation. Nếu thầy yêu cầu đúng đề tài ban đầu, cần điều chỉnh phạm vi/kỹ thuật sau khi nhận câu trả lời.

## 11. Phần cứng dự kiến (chưa phải xác nhận tương thích cuối)

Theo `docs/phuonganlam.md` §5, đề xuất cho một thiết bị phát cảnh báo:

| Linh kiện | SL | Giá tham khảo trong phương án | Vai trò |
|---|---:|---:|---|
| ESP32 DevKit V1 | 1 | 125.000đ | Wi-Fi, nhận lệnh, điều khiển phát |
| MAX98357A I2S | 1 | 40.000đ | Khuếch đại tín hiệu số cho loa |
| Loa 8Ω 3W | 1 | 40.000đ | Phát câu tiếng Việt ghi sẵn |
| Breadboard + dây Dupont | 1 bộ | 50.000đ | Lắp thử mạch |
| **Tổng theo phương án** | | **255.000đ** | Chưa tính cáp/đồ hàn/ship; kiểm tra giá thực tế |

Laptop và webcam USB đã có. Không mua ESP32-CAM, HC-SR04, micro, TFT/OLED cho MVP hiện tại theo phương án. Trước khi mua, hỏi thầy xác nhận quy mô, biến thể ESP32 và tiêu chí phần cứng. Chân I2S, nguồn, flash, đầu nối loa và thư viện cần xác minh trên đúng bo mạch; không kết luận chỉ từ tên dòng chip.

## 12. Cách trình bày trung thực với giảng viên

Có thể trình bày theo thứ tự:
1. Bài toán em đang giải quyết và đối tượng sử dụng.
2. Luồng hệ thống: webcam → AI laptop → đa giác + state machine → backend/DB → dashboard; loa ESP32 là phần đang chuẩn bị.
3. Vì sao Edge AI: xử lý frame cục bộ, riêng tư, không gọi dịch vụ AI cloud theo từng frame.
4. Đóng góp dự kiến: kiểm tra vùng + theo dõi + xác nhận nhiều frame/chống báo lặp; sẽ đo A/B/C, chưa tuyên bố hiệu năng khi chưa có số.
5. Nêu rõ khác biệt với mô tả bám bắt mục tiêu ban đầu và xin thầy chốt hướng trước khi mở rộng.
6. Hỏi tiêu chí bắt buộc, model/đối tượng cần track, FPS, quy mô phần cứng, cách đánh giá.

### Câu trả lời ngắn nếu thầy hỏi “Edge AI ở đâu?”

“Model YOLO chạy trực tiếp trên laptop cạnh webcam. Khung hình được xử lý tại chỗ, không gửi lên API AI cloud. Edge AI gửi metadata sự kiện qua HTTP nội bộ đến backend; backend lưu sự kiện và dashboard hiển thị. Phần nhận diện là Edge AI; backend/web là hệ thống quản lý và trình bày kết quả.”

### Câu trả lời ngắn nếu thầy hỏi “đóng góp của em là gì?”

“Em không tự nhận đóng góp là huấn luyện model mới. Em dùng model pretrained; phần em cần chứng minh là chuỗi quyết định từ detection/tracking, vị trí trong vùng, xác nhận qua nhiều frame, chống sự kiện lặp và tích hợp backend. Em sẽ so sánh cấu hình và đo trên dữ liệu có nhãn để kiểm chứng.”

## 13. Tài liệu trong repo

- `docs/phuonganlam.md` — phương án kỹ thuật gốc và danh sách mua.
- `docs/roadmap.md` — các phase mở rộng (Zone editor, IoT, mobile/QR).
- `docs/bao-cao-tien-do-tuan.md` — nhật ký tiến độ 3 tuần và tài liệu chuẩn bị báo cáo.
- `docs/nghien-cuu-de-tai.md` — ghi chú học nhanh, câu hỏi cho giảng viên và hướng model.
- `docs/api-contract.md`, `docs/openapi.json` — hợp đồng API hiện có.
- `AGENTS.md` — ranh giới và quyết định quan trọng của repo.
