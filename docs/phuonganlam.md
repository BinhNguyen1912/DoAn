# Phương án chốt đồ án giám sát vùng nguy hiểm bằng Edge AI và cảnh báo giọng nói

**Bản quyết định kỹ thuật và kế hoạch thực hiện** | 10 tháng 10 năm 2026

> **Khuyến nghị chốt:** dùng webcam USB sẵn có để quan sát một vùng mô phỏng; laptop MSI Modern 14 i7, RAM 16 GB chạy phát hiện người, logic cảnh báo và phần mềm quản lý; một ESP32 DevKit mới mua nhận lệnh qua Wi-Fi và phát câu cảnh báo tiếng Việt qua MAX98357A cùng loa. Tập trung vào độ tin cậy của sự kiện, trạng thái phát loa và thực nghiệm đối chứng.
>
> ⚠️ Đây là nguyên mẫu học thuật, **không** phải thiết bị bảo vệ trẻ em được chứng nhận.

## Mục lục

1. [Cơ sở quyết định](#1-cơ-sở-quyết-định)
2. [Mục tiêu và ranh giới MVP](#2-mục-tiêu-và-ranh-giới-mvp)
3. [Kiến trúc được chọn](#3-kiến-trúc-được-chọn)
4. [Nghiên cứu repo và cách sử dụng](#4-nghiên-cứu-repo-và-cách-sử-dụng)
5. [Danh sách mua dự kiến](#5-danh-sách-mua-dự-kiến)
6. [Các mốc thực hiện và tiêu chí hoàn thành](#6-các-mốc-thực-hiện-và-tiêu-chí-hoàn-thành)
7. [Kế hoạch đánh giá để bảo vệ đồ án](#7-kế-hoạch-đánh-giá-để-bảo-vệ-đồ-án)
8. [Rủi ro và quyết định kỹ thuật cần giữ](#8-rủi-ro-và-quyết-định-kỹ-thuật-cần-giữ)
9. [Nguồn đã đối chiếu](#9-nguồn-đã-đối-chiếu)

---

## 1. Cơ sở quyết định

| Đã có | Chưa mua hoặc chưa xác minh | Quyết định |
|---|---|---|
| MSI Modern 14 i7, RAM 16 GB, SSD 256 GB | Mã CPU, GPU và dung lượng trống chưa xác minh | Chạy AI và toàn bộ dịch vụ trên laptop; benchmark trước khi chốt độ phân giải. |
| Webcam rời được quảng cáo Full HD 1080p, có mic | Chất lượng thiếu sáng và FPS thực chưa đo | Dùng webcam cố định; không mua ESP32-CAM. Mic không dùng trong MVP. |
| Tài liệu và ZIP Xiaozhi trên Drive | ESP32, âm thanh, dây và nguồn chưa mua | ZIP dùng để tham khảo phần cứng; viết firmware cảnh báo riêng. |

Tài liệu Drive hiện có chia làm hai hướng:

- Bản đầu dùng HC-SR04, còi/LED và lịch 10 tuần.
- Ba bản còn lại có cùng nội dung văn bản, chọn cảnh báo bằng lời tiếng Việt và lịch 7 tuần.

Phương án này theo hướng thứ hai, đồng thời bổ sung cách đo và kiểm soát lỗi. `[D1–D3]`

---

## 2. Mục tiêu và ranh giới MVP

### Mục tiêu

- Phát hiện lớp `person` bằng mô hình đã huấn luyện sẵn; một webcam, một vùng nguy hiểm đa giác và một ESP32.
- Ghi đúng **một** sự kiện cho mỗi lần người đi vào vùng; tránh báo lặp khi người đứng lâu hoặc mô hình chập chờn.
- Phát câu tiếng Việt ghi sẵn từ ESP32; lưu trạng thái gửi lệnh và phản hồi của thiết bị trên dashboard.
- Cho phép chỉnh vùng trên giao diện web, xem lịch sử, ảnh minh chứng tùy chọn và tình trạng online/offline.
- Đánh giá bằng dữ liệu thử có nhãn: bỏ sót, báo nhầm, độ trễ tới lúc loa bắt đầu phát và lỗi kết nối.

### Không nằm trong MVP

- Xác định tuổi hoặc danh tính.
- Huấn luyện mô hình từ đầu.
- Micro và chatbot.
- Màn TFT/OLED, HC-SR04.
- Nhiều camera, ứng dụng điện thoại, thông báo đẩy.
- Phân tích video bằng LLM.

> Nếu còn thời gian, có thể thêm vùng "đang tiếp cận" nhưng chỉ mô tả đó là vị trí tương đối trên ảnh, không phải khoảng cách vật lý.

---

## 3. Kiến trúc được chọn

| Thành phần | Trách nhiệm và giao tiếp |
|---|---|
| **Edge AI trên laptop** | OpenCV đọc webcam; YOLO loại nhỏ phát hiện person; tracking giữ ID tạm; kiểm tra điểm giữa cạnh đáy bounding box so với đa giác; tạo sự kiện qua REST. |
| **NestJS + PostgreSQL** | Lưu vùng, thiết bị, sự kiện, trạng thái phát. Nhận sự kiện, gửi lệnh HTTP nội bộ tới ESP32, ghi ACK hoặc lỗi. |
| **ESP32 + MAX98357A + loa** | Kết nối cùng Wi-Fi; nhận lệnh có `event_id`, phát tệp âm thanh ghi sẵn từ flash, phản hồi trạng thái. |
| **React dashboard** | Vẽ vùng trên ảnh tham chiếu, xem thiết bị, lịch sử và lý do cảnh báo. |

### Luồng chuẩn

```text
webcam → AI trên laptop → quyết định xâm nhập vùng → POST sự kiện tới backend
       → backend ghi dữ liệu và gửi lệnh → ESP32 phát lời cảnh báo
       → backend cập nhật trạng thái → dashboard hiển thị
```

Camera không cần phát video tới ESP32. Trong bản demo, mọi thành phần ở cùng mạng LAN; IP của ESP32 được cấu hình cố định hoặc đặt DHCP reservation.

### Quy tắc cảnh báo có thể giải thích

- Điểm kiểm tra vùng là **điểm giữa đáy khung bao người**; vùng lưu dưới tọa độ chuẩn hóa để không lệch khi thay đổi kích thước ảnh.
- Một người phải được thấy trong vùng qua nhiều khung hình liên tiếp trước khi tạo sự kiện. Bắt đầu thử với **3 khung**, sau đó hiệu chỉnh bằng dữ liệu thử.
- Dùng `track_id` và trạng thái `OUTSIDE → CANDIDATE → ALERTED → EXITED`; chỉ phát lại khi người rời vùng rồi vào lại, hoặc sau cooldown cấu hình nếu tình huống yêu cầu.
- Mỗi lệnh có `event_id` để ESP32 bỏ qua lệnh trùng. Tách các trạng thái: **đã gửi**, **đã nhận**, **bắt đầu phát**, **phát xong**, **thất bại**. Không suy diễn loa đã phát chỉ từ việc backend gửi HTTP thành công.
- Ảnh chỉ lưu khi xảy ra sự kiện và khi chế độ lưu ảnh được bật; giữ thời hạn ngắn, không mặc định lưu video liên tục.
- Token thiết bị và API chỉ dùng trong LAN thử nghiệm.
- Nếu laptop hoặc Wi-Fi mất, AI không còn cảnh báo được; dashboard cần hiện trạng thái offline. `[R1–R6]`

---

## 4. Nghiên cứu repo và cách sử dụng

| Repo / nguồn | Dùng vào việc gì | Giới hạn cần nhớ |
|---|---|---|
| Ultralytics YOLO `[R1]` | Model pretrained loại nhỏ, detect/track person; benchmark và thử ONNX khi cần. | Giấy phép AGPL-3.0; ghi nguồn và kiểm tra nghĩa vụ nếu công bố/phân phối. Không sao chép nguyên một demo rồi gọi là đóng góp. |
| OpenCV `[R2]` | Đọc webcam, vẽ overlay, xử lý khung hình và hình học vùng. | Không tự giải quyết logic sự kiện hay độ tin cậy cảnh báo. |
| Arduino-ESP32 `[R3]` | Wi-Fi, HTTP/WebServer, I2S phát PCM, LittleFS lưu âm thanh. | Phải thử chân I2S, phân vùng flash và định dạng âm thanh trên đúng bo mạch. |
| NestJS `[R4]` | REST API, module thiết bị/vùng/sự kiện, điều phối lệnh. | Cần tách ACK của ESP32 khỏi phản hồi API; không đánh dấu thành công quá sớm. |
| PostgreSQL `[R5]` | Lưu vùng, thiết bị, sự kiện, trạng thái và mốc thời gian. | Chỉ cần schema nhỏ; không lưu video trong database. |
| React `[R6]` | Dashboard một trang: vùng, trạng thái, lịch sử và thống kê. | Giữ UI gọn; tránh dành phần lớn thời gian cho trang trí. |
| Xiaozhi từ ZIP Drive `[D3]` | Tham khảo sơ đồ ESP32, MAX98357A và nguồn âm thanh. | Firmware trong ZIP phục vụ chatbot; chưa có luồng lệnh cảnh báo, AI vùng, NestJS hoặc dashboard. Không nạp nhầm bản OLED/TFT. |

### 4.1. Tái sử dụng mã Xiaozhi trong phương án đã chốt

**Phần có thể tham khảo:**

- Cấu hình chân ESP32: `main/boards/bread-compact-esp32/config.h`
- Cách khởi tạo bo mạch: `esp32_bread_board.cc`
- Mã xuất âm thanh I2S: `main/audio/codecs/no_audio_codec.cc`
- Cách kết nối Wi-Fi

Chỉ dùng sau khi đối chiếu chân trên bo mạch mua thực tế, định dạng âm thanh và giấy phép nguồn. `[D3]`

**Phần phải phát triển riêng:**

- Firmware ESP32 nhận lệnh HTTP nội bộ chứa `event_id`, phát một câu tiếng Việt ghi sẵn từ flash qua MAX98357A, trả trạng thái nhận/phát/lỗi.
- Backend chống lệnh trùng và ghi nhận ACK.
- Mã AI webcam, kiểm tra vùng, NestJS và dashboard không có sẵn trong ZIP.

**Phần không đưa vào MVP:**

- Micro, nhận diện giọng nói, chatbot, kết nối máy chủ Xiaozhi, màn TFT/OLED.
- Không nạp nguyên firmware `.bin` OLED/TFT trong ZIP vì các bản đó phục vụ chatbot, chưa thực hiện luồng cảnh báo của đồ án.

### 4.2. AI và API

- Model phát hiện person đã huấn luyện sẵn được tải riêng một lần, không nằm trong ZIP; chưa cần tự huấn luyện từ đầu.
- Đánh giá bằng video thử do nhóm tự gán nhãn, chỉ cân nhắc fine-tune nếu kết quả chưa đạt.
- Các khung hình được xử lý trên laptop; **không** gọi API AI đám mây theo từng khung.
- Khi phát sinh sự kiện, backend chỉ gửi lệnh cho ESP32 trên mạng LAN và nhận phản hồi.
- Model person không xác định được tuổi. `[R1]`

### 4.3. Cách sử dụng model trên webcam

**Chọn model.** Dùng `yolo26n.pt` (bản nano, detect) làm mốc thử đầu tiên trên CPU laptop. Đây là trọng số đã huấn luyện trên COCO, có lớp `0 = person`; tải một lần khi cài/chạy lần đầu rồi đặt bản đã kiểm thử tại `apps/edge-ai/models/`. Không cần tải toàn bộ COCO hay train từ đầu. Nếu sau này thay model tự huấn luyện, phải kiểm tra lại `model.names` thay vì mặc định class 0. `[R1, R1c, R1e]`

**Lệnh thử nhanh** (sau khi cài Python và `ultralytics`):

```bash
yolo predict model=yolo26n.pt source=0 classes=0 device=cpu imgsz=640 show=True
```

Nếu webcam rời không ở chỉ số 0, đổi `source=1`. Đây chỉ là bước xác nhận camera và model, chưa phát cảnh báo. `[R1c]`

**Trong `edge-ai`**, OpenCV đọc từng khung hình và gọi:

```python
model.track(
    frame,
    persist=True,
    tracker="bytetrack.yaml",
    classes=[0],
    conf=0.35,
    imgsz=640,
    device="cpu",
    verbose=False,
)
```

- Lấy `boxes.xyxy` và ID theo dõi nếu có.
- Lấy điểm giữa cạnh đáy khung người rồi dùng `cv2.pointPolygonTest` để xét vùng đa giác.
- `persist=True` chỉ áp dụng cho các khung liên tiếp của cùng camera.
- Ngưỡng `conf=0.35` và quy tắc 3 khung liên tiếp là giá trị khởi đầu để đo lại, **không phải** kết quả đã được kiểm chứng. `[R1a, R1d, R2a]`

**Chống báo lặp:**

- Chỉ tạo một sự kiện khi người mới vào vùng; không gửi API ở mỗi khung hình.
- Sau khi người rời vùng đủ thời gian mới cho phép cảnh báo lại.
- ID tracking có thể thay đổi khi người bị che khuất nên logic chống lặp cần trạng thái vùng và khoảng chờ, không chỉ dựa vào ID.
- Đo FPS, độ trễ và bỏ sót trên chính laptop; nếu CPU chậm, thử `imgsz=416` hoặc `320` và giảm nhịp xử lý trước khi đổi kiến trúc.

### 4.4. Thư mục tổng chứa toàn bộ source

Khung thư mục tổng đã được tạo để gom tất cả source của đồ án; mã tham khảo Xiaozhi nằm riêng, không được coi là phần do nhóm tự xây dựng:

```text
safe-zone-monitor/
├── README.md
├── .env.example
├── apps/
│   ├── edge-ai/        # README.md, requirements.txt, src/, models/
│   ├── backend/        # README.md, src/
│   ├── web/            # README.md, src/
│   └── mobile/         # README.md, src/
├── iot/
│   ├── esp32-alert/    # README.md, src/, data/
│   └── xiaozhi-source/ # README_en.md, LICENSE, main/
├── evaluation/         # clips/, labels/
├── hardware/
│   └── README.md
└── docs/               # architecture.md, api-contract.md
```

| Thư mục | Vai trò |
|---|---|
| `apps/edge-ai` | Dịch vụ Python |
| `apps/backend` | NestJS/PostgreSQL |
| `apps/web` | React |
| `apps/mobile` | Dành cho giai đoạn mở rộng |
| `iot/esp32-alert` | Firmware cảnh báo phải viết riêng |
| `iot/xiaozhi-source` | Giữ nguyên source trích từ ZIP để đối chiếu và ghi nguồn; không build chung với firmware cảnh báo |

> **Lưu ý:** hiện các ứng dụng và firmware cảnh báo mới là khung thư mục; chưa có hệ thống chạy được. Không đưa `.venv`, `node_modules`, video thử chứa người, mật khẩu hoặc model `.pt` lên Git mặc định. Kiểm tra dung lượng flash và chân I2S trên bo mạch thật trước khi đưa WAV vào firmware.

### 4.5. Thư viện tối thiểu và giao tiếp giữa các phần

| Phần | Thư viện / công nghệ | Ghi chú |
|---|---|---|
| **AI (Python)** | `ultralytics`, `opencv-python`, `numpy`, `httpx` | `ultralytics` để detect/track; `opencv-python` đọc webcam, vẽ vùng, `pointPolygonTest`; `numpy` cho tọa độ; `httpx` để POST sự kiện. Dùng `requirements.txt` với phiên bản đã thử trên laptop. Không cần dịch vụ cloud AI. `[R1c, R1a, R2a]` |
| **API (Node.js/TypeScript)** | NestJS, `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `class-validator`, `class-transformer` | PostgreSQL lưu `zone`, `device`, `event`, `alert_attempt`. Dùng `fetch` có sẵn của Node để gửi HTTP tới ESP32. Chọn bản Node LTS đáp ứng đồng thời yêu cầu hiện hành của Nest CLI và Vite. `[R4a, R4b, R4c, R6a]` |
| **Web (TypeScript)** | React + Vite | Dùng `fetch` của trình duyệt và SVG phủ trên ảnh tham chiếu để vẽ đa giác. MVP một trang nên chưa cần thư viện quản lý trạng thái hoặc đồ thị. |
| **Firmware (Arduino-ESP32 C++)** | `WiFi.h`, `WebServer.h`, `LittleFS.h`, `ESP_I2S.h` | Đọc WAV PCM ngắn từ flash và ghi mẫu âm thanh theo từng khối ra I2S/MAX98357A; không cần chatbot hoặc TTS. `[R3b, R6a]` |

### 4.6. Hợp đồng API dự kiến

| Từ → Đến | Endpoint | Nội dung |
|---|---|---|
| edge-ai → backend | `POST /api/events` | `event_id`, `zone_id`, thời điểm, độ tin cậy |
| backend → ESP32 | `POST /alert` | `event_id`; ESP32 trả kết quả phát |
| web → backend | `GET /api/events` | Lịch sử sự kiện |
| web → backend | `GET/PUT /api/zones` | Xem/chỉnh vùng |
| web → backend | `GET /api/devices` | Trạng thái thiết bị |

Viết rõ định dạng JSON, lỗi, timeout và chống trùng trong `docs/api-contract.md` trước khi tích hợp. Đây là API nội bộ trong mạng LAN, chỉ phát sinh theo sự kiện.

### 4.7. Ưu tiên triển khai

Dùng các repo chính chủ làm nền tảng và ví dụ; phần tạo giá trị của đồ án là:

- Máy trạng thái cảnh báo.
- Tích hợp end-to-end.
- Cơ chế xác nhận (ACK).
- Thí nghiệm đối chứng và phân tích lỗi.

Tài liệu Ultralytics hỗ trợ tracking qua các khung liên tiếp và benchmark CPU/ONNX; Arduino-ESP32 có API I2S và ví dụ LittleFS. `[R1, R3]`

---

## 5. Danh sách mua dự kiến

| Món | Số lượng | Giá tham khảo | Ghi chú |
|---|---:|---:|---|
| ESP32 DevKit V1 30 chân CH340 USB-C `[G1]` | 1 | 125.000đ | Có mạch nạp USB; không cần USB-UART riêng. |
| MAX98357A I2S `[G2]` | 1 | 40.000đ | Chọn module có header hoặc chuẩn bị hàn chân. |
| Loa 8Ω 3W có vỏ `[G3]` | 1 | 40.000đ | Kiểm tra đầu nối PH2.0 trước khi mua; có thể cần chuyển/cắt dây. |
| Breadboard 400 lỗ `[G4]` | 1 | 20.000đ | Dùng để thử mạch, không phải lắp đặt lâu dài. |
| Dây Dupont đực-cái 40 sợi `[G5]` | 1 | 30.000đ | Xác nhận kiểu chân của module; bổ sung dây nếu cần. |
| **Tổng hàng đã có giá** | | **255.000đ** | Chưa gồm cáp USB-C, phụ kiện nối loa và vận chuyển. |

- Dành thêm khoảng **55.000–110.000đ** cho cáp USB-C nếu chưa có, đầu nối/đồ hàn nhỏ và phí vận chuyển.
- Tổng kế hoạch khoảng **310.000–365.000đ**; giữ trần **500.000đ** làm dự phòng.
- Đây là giá niêm yết quan sát ngày 10/10/2026, không bảo đảm tồn kho, phí giao hàng hoặc giá tại thời điểm thanh toán.
- Trước khi đặt, xác nhận cổng USB, module amp có chân hàn chưa, dây loa kết nối được với OUT+/OUT− và nguồn cấp phù hợp. `[G1–G5]`

**Không mua trong đợt đầu:** ESP32-CAM, HC-SR04, micro INMP441, màn TFT/OLED, còi rời hoặc bộ chatbot trọn gói. Webcam đã có đảm nhiệm camera; câu nói ghi sẵn không cần micro.

---

## 6. Các mốc thực hiện và tiêu chí hoàn thành

| Tuần | Kết quả cần nhìn thấy |
|:---:|---|
| 1 | Kiểm tra webcam trên laptop; đo thử model nhỏ và FPS; chốt vị trí camera/vùng. Đặt linh kiện khi đã xác nhận đầu nối. |
| 2 | ESP32 kết nối Wi-Fi và phát độc lập một câu WAV/PCM qua MAX98357A; kiểm tra nguồn và âm lượng. |
| 3 | Edge AI phát hiện person, theo dõi ID và kiểm tra đa giác; có video demo với overlay. |
| 4 | NestJS + PostgreSQL lưu thiết bị, vùng và sự kiện; luồng từ Edge tới API chạy ổn. |
| 5 | Tích hợp backend → ESP32; ghi trạng thái ACK/lỗi; chống lệnh trùng và báo lặp. |
| 6 | Dashboard chỉnh một vùng, xem sự kiện, trạng thái thiết bị và ảnh tùy chọn. |
| 7 | Thu dữ liệu thử có nhãn, so sánh baseline với bản hoàn chỉnh, tối ưu sau khi đo. |
| 8 | Chạy demo toàn hệ thống, thử mất mạng/thiếu sáng, hoàn thiện báo cáo, sơ đồ mạch và video minh họa. |

**Các cổng chốt:**

- **Cổng chốt tuần 2:** nếu ESP32 chưa phát được âm thanh rõ từ file ghi sẵn, dừng tích hợp và sửa phần cứng/firmware trước.
- **Cổng chốt tuần 5:** một sự kiện phải đi trọn từ webcam tới loa và xuất hiện trong database; sau đó mới làm đẹp dashboard.

---

## 7. Kế hoạch đánh giá để bảo vệ đồ án

So sánh ba cấu hình trên cùng video hoặc cùng kịch bản:

| Cấu hình | Mô tả |
|:---:|---|
| **A** | Phát hiện person là báo. |
| **B** | Thêm kiểm tra vùng. |
| **C** | Thêm tracking, kiểm tra qua nhiều khung và chống lặp. |

Sự khác biệt giữa B và C là phần đóng góp kỹ thuật cần chứng minh, không dựa vào một video demo may mắn.

**Yêu cầu thực nghiệm:**

- Tối thiểu **100 lượt thử** có nhãn và mô tả rõ số lượt dương/âm; dùng người trưởng thành tình nguyện và vùng nguy hiểm mô phỏng.
- Ghi bảng cho các tình huống: người đi vào vùng, đi sát mép, đi ngang ngoài vùng, đứng lâu, nhiều người, bị che khuất, thiếu sáng và camera rung nhẹ.
- Đo: precision/recall ở mức sự kiện, số báo nhầm mỗi giờ, số lệnh phát trùng, FPS, độ trễ p50/p95 từ lúc vào vùng đến lúc loa bắt đầu phát.
- Ngắt Wi-Fi, tắt backend và tắt ESP32 để kiểm tra dashboard có báo lỗi đúng; tách mất hình, mất suy luận và mất thiết bị âm thanh.

> Ngưỡng chấp nhận nên chốt sau buổi đo thử đầu tiên và ghi rõ phần cứng, ánh sáng, vị trí camera. Không cam kết trước độ chính xác 90% hoặc cảnh báo dưới 1 giây nếu chưa có số đo. `[S8]`

---

## 8. Rủi ro và quyết định kỹ thuật cần giữ

| Rủi ro | Cách xử lý |
|---|---|
| Model chỉ nhận diện người, không phân biệt tuổi | Tên chức năng và câu cảnh báo dùng "có người trong vùng nguy hiểm"; không tuyên bố phát hiện trẻ em. |
| Dễ báo nhầm ở mép vùng hoặc tạo lặp | Điểm đáy khung bao, kiểm tra nhiều khung, tracking, hysteresis và cooldown; đo bằng dữ liệu thử. |
| Webcam thiếu sáng hoặc bị che | Giữ camera cố định, thử nhiều điều kiện và ghi rõ tỷ lệ bỏ sót. |
| Mất Wi-Fi/laptop hoặc loa không phát | Heartbeat và ACK; trạng thái `FAILED`/`ONLINE` hiển thị rõ; không xem HTTP gửi thành công là phát loa thành công. |
| Dữ liệu hình ảnh riêng tư | Mặc định không ghi video liên tục; chỉ lưu ảnh sự kiện khi bật và xóa theo thời hạn. |
| Thời gian bị kéo sang chatbot/LLM | Giữ LLM ngoài đường cảnh báo. Nếu dư thời gian, chỉ dùng để tóm tắt metadata lịch sử, không quyết định có phát loa hay không. |

---

## 9. Nguồn đã đối chiếu

### Tài liệu Drive

| Mã | Nguồn |
|---|---|
| D1 | Đề xuất giám sát an toàn trẻ em |
| D2 | Đề xuất cảnh báo an toàn bằng giọng nói tiếng Việt |
| D3 | ZIP Chatbot Xiaozhi và sơ đồ phần cứng |

### Repo và tài liệu kỹ thuật

| Mã | Nguồn |
|---|---|
| R1 | Ultralytics YOLO repo, tracking và benchmark |
| R1a | Tài liệu tracking Ultralytics |
| R1b | Tài liệu benchmark Ultralytics |
| R1c | Ultralytics Quickstart: cài đặt và tải model |
| R1d | Ultralytics Predict: boxes, conf và classes |
| R1e | COCO: lớp 0 là person |
| R2 | OpenCV repo |
| R2a | OpenCV `pointPolygonTest` |
| R3 | Arduino-ESP32 repo |
| R3a | Ví dụ LittleFS Arduino-ESP32 |
| R3b | Arduino-ESP32 I2S API |
| R4 | NestJS repo |
| R4a | NestJS database overview |
| R4b | NestJS First steps |
| R4c | NestJS ValidationPipe |
| R5 | PostgreSQL repo |
| R6 | React repo |
| R6a | Vite Guide |
| S8 | Tài liệu đánh giá mô hình Ultralytics |

### Nguồn mua hàng

| Mã | Nguồn |
|---|---|
| G1 | ESP32 DevKit V1 30 chân, Điện tử Đức Huy |
| G2 | MAX98357A, Hshop |
| G3 | Loa 8Ω 3W có vỏ, Hshop |
| G4 | Breadboard 400 lỗ, Hshop |
| G5 | Dây Dupont đực-cái, Hshop |
