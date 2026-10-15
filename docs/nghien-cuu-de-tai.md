# Nghiên cứu đề tài & chuẩn bị trình bày thầy

> Tài liệu tự học sáng sớm (15/10/2026). Tóm tắt: đề tài thầy giao vs cái đang làm, Edge AI, chọn model tracking realtime trên webcam CPU, câu hỏi mang đi hỏi thầy, danh sách mua. Đọc cùng `docs/phuonganlam.md`, `docs/bao-cao-tien-do-tuan.md`, `AGENTS.md`.

---

## 1. Rất quan trọng: hai "đề tài" đang lệch nhau

**Thầy giao (bản gốc):** hệ thống **bám bắt mục tiêu trong video** — người dùng chọn 1 đối tượng ở khung đầu, hệ thống tự theo dõi ở các khung sau. Kết hợp 3 thành phần:
1. **Phân đoạn ảnh (segmentation)** — tách vùng mục tiêu thành **mask** (không chỉ hộp).
2. **Bộ nhớ chuyển động (motion memory)** — lưu lịch sử vị trí, **dự đoán** khi bị che.
3. **Lan truyền thời gian (temporal propagation)** — cập nhật mask xuyên suốt video khi vật đổi dạng / chạy nhanh / bị che.

Dùng **model pretrained, không train thêm**. → Đây là họ **Video Object Segmentation (SAM-Track / SAM 2 / XMem / DeAOT / CUTIE)**.

**Mình đang làm (Safe Zone Monitor):** phát hiện người (YOLO) + ByteTrack + kiểm tra vùng đa giác + cảnh báo loa ESP32. Là **cảnh báo xâm nhập vùng**, KHÔNG phải "chọn object rồi bám mask".

**Trùng:** cả hai đều "tracking". **Khác:** phương pháp (mask+propagation vs detection+association) và bài toán (bám 1 object vs cảnh báo vùng).

→ **Câu chốt mang đi hỏi thầy:** đề tài chính thức giờ là (a) bám bắt object, (b) Safe Zone Monitor, hay (c) **gộp**: "bám bắt mục tiêu (người) trong video, ứng dụng giám sát vùng nguy hiểm"? Mình khuyên (c) — vừa có đóng góp kỹ thuật (tracking) vừa có ứng dụng thật.

---

## 2. Yêu cầu mới của bạn: realtime trên webcam, KHÔNG dùng video file

Vì yêu cầu là camera realtime, tốc độ trên máy thật là ràng buộc quan trọng. SAM 2/video segmentation có nguy cơ nặng trên CPU; **chưa đo trên laptop này nên không chốt FPS hoặc loại model chỉ bằng ước lượng**. Benchmark ứng viên trên cùng webcam trước khi chọn. Hiện pipeline đã được thử với YOLO11n trên CPU; GPU chưa được xác minh/đưa vào sử dụng.

### 2 đường chạy realtime được trên CPU

| | Đường 1: person-only, hướng tích hợp đơn giản hơn | Đường 2: hướng bất kỳ object, nhiều phần cần tự tích hợp hơn |
|---|---|---|
| Model | **YOLO11n-seg** (ra mask) + **ByteTrack** | **FastSAM** / MobileSAM / EdgeSAM + tracker |
| Segmentation | mask từ YOLO-seg | mask từ FastSAM (segment anything) |
| Motion memory | ByteTrack có Kalman-based motion estimation; không tương đương memory segmentation | cần chọn/ghép tracker và kiểm chứng |
| Duy trì qua frame | nối ID/bounding box; không lan truyền mask | tracker phải duy trì object/mask qua frame; cần prototype |
| "Chọn object khung đầu" | click → chọn track_id của người đó | click bất kỳ object → bám mask object đó |
| Object theo dõi | **chỉ person** | **bất kỳ object** (người, ly, chó…) |
| FPS trên laptop CPU | Chưa benchmark với biến thể segmentation | Chưa benchmark; cần làm prototype đo |
| Công sức dự kiến | Thấp hơn vì có thể tái dùng pipeline, nhưng vẫn phải thử model và thêm lựa chọn track | Cao hơn vì cần ghép segmentation với tracker và xử lý chọn mục tiêu |
| Khả năng gây ấn tượng | Có mask nhưng giới hạn person | Có thể tổng quát hơn nếu prototype chứng minh chạy ổn |

> SAM 2 / SAM-Track / XMem / DeAOT là các hướng video segmentation/tracking đáng khảo sát, nhưng chi phí tính toán thực tế trên laptop này **chưa đo**. Không khẳng định chạy realtime hay không trước khi benchmark. Nếu chậm, có thể giảm độ phân giải/nhịp xử lý hoặc chọn phương án nhẹ hơn sau khi thầy chốt phạm vi.

### Câu phân biệt phải hỏi thầy
**"Theo dõi chỉ người, hay bất kỳ object nào người dùng click?"**
- Chỉ người → thử **đường 1**; khả năng đáp ứng FPS phải đo.
- Bất kỳ object → khảo sát **đường 2**; cần prototype và benchmark trước khi chốt.

---

## 3. Edge AI (AI biên) là gì + chứng minh mình đang có Edge AI

**Edge AI** = chạy mô hình AI **trực tiếp trên thiết bị gần nguồn dữ liệu** (laptop, ESP32, camera) thay vì gửi dữ liệu lên cloud xử lý. "Biên" = thiết bị cuối, gần nơi sinh dữ liệu.

**Điều chứng tỏ hệ thống LÀ Edge AI:**
- YOLO chạy **ngay trên laptop CPU** (`torch-2.14.1+cpu`), khung hình webcam **không rời laptop**.
- **Không gọi API AI cloud** nào (không Azure/AWS Vision, không Google, không OpenAI) → không có API key đám mây, không chi phí theo lần gọi, không giới hạn quota.
- Backend + PostgreSQL chạy **trong LAN** (`localhost:3000`); ESP32 cũng trong LAN. Traffic suy luận toàn HTTP nội bộ LAN, không ra Internet.
- "Biên" 2 lớp: **laptop** (chạy YOLO nặng) + **ESP32** (biên nhỏ, phát loa).

### "Có đang gọi AI/API quá nhiều không?" → KHÔNG
Suy luận chạy cục bộ. "API" duy nhất là HTTP nội bộ LAN của chính hệ thống (edge-ai → backend → ESP32 → web), không tốn tiền, không quota. Đây chính là **điểm mạnh Edge AI**: bảo mật dữ liệu (ảnh không ra ngoài) + chi phí 0 + chạy offline/LAN.

---

## 4. So sánh: train model riêng vs dùng pretrained

| | Dùng pretrained (YOLO11n / FastSAM) | Tự train/fine-tune |
|---|---|---|
| Công sức | Rất thấp | Cao |
| Dữ liệu | Không cần | Hàng trăm–nghìn ảnh có nhãn |
| Phần cứng train | Không cần | Cần GPU; máy yếu → dùng Google Colab (free có GPU) |
| Độ chính xác | Tốt chung; có thể báo nhầm | Tốt hơn cho ngữ cảnh cụ thể |
| Phù hợp MVP | ✅ | Chỉ nếu báo nhầm nhiều (sau khi đo A/B/C) |
| Đóng góp kỹ thuật | KHÔNG nằm ở model — nằm ở **logic vùng + tracking + chống lặp** | Có thể là đóng góp thêm |

**Khuyến nghị:** MVP dùng pretrained, không train từ đầu. Nếu đánh giá có nhầm lẫn có hệ thống và thầy đồng ý, mới cân nhắc fine-tune trên dữ liệu đã thu thập/gán nhãn và tách tập đánh giá. Quy mô dữ liệu, số epoch và tài nguyên cần được xác định bằng thử nghiệm; chưa chốt một con số trước khi có dữ liệu.

---

## 5. Cách làm NỔI BẬT đồ án

1. **Chọn model có căn cứ**: so sánh model pretrained phù hợp với yêu cầu chọn mục tiêu, mask và realtime; nêu rõ hạn chế/giấy phép và benchmark trên thiết bị thật.
2. **Mask thay vì hộp** — overlay đối tượng tách nền đẹp mắt, demo "wow".
3. **So sánh 2 tracker** (ByteTrack detection vs FastSAM/Seg tracking) trên cùng webcam: bám bắt khi **che khuất / đổi dạng / chạy nhanh** → **đóng góp kỹ thuật đo được** (recall/precision bám bắt). Giống A/B/C.
4. **Ứng dụng thật** "giám sát vùng nguy hiểm" — đề tài tracking có ngữ cảnh áp dụng thực, không phải demo sáo rỗng.
5. **Edge AI** — chạy cục bộ, ảnh không lên cloud → góc bảo mật + chi phí 0.
6. **Chống báo lặp** máy trạng thái `OUTSIDE→CANDIDATE→ALERTED→EXITED` + 3 khung + cooldown — có unit test, dễ kiểm chứng.

---

## 6. Điểm hay của hệ thống hiện tại (để báo cáo)

1. Edge AI thật: suy luận cục bộ trên laptop CPU, khung hình không rời máy, không cloud → bảo mật + chi phí 0 + offline/LAN.
2. Chống báo lặp bằng máy trạng thái + 3 khung liên tiếp + ByteTrack (theo `track_id`) + cooldown — có unit test.
3. Sự kiện idempotent theo `eventId`: gửi lại không tạo trùng (backend trả 200 thay vì 201).
4. Hợp đồng API chính thức (OpenAPI sinh tự động); web dùng kiểu TypeScript sinh từ đó → không lệch contract.
5. Đa giác vùng tọa độ chuẩn hóa 0..1: độc lập độ phân giải camera.
6. Tích hợp sớm bằng sự kiện giả: nối thô edge→backend→web tuần 3 đúng kế hoạch giảm rủi ro tuần 5.
7. Một repo monorepo, một lệnh `npm run dev` khởi động cả backend + web + edge-ai.

---

## 7. Câu hỏi mang đi hỏi thầy (mai)

1. Đề tài chính thức giờ là **bám bắt object (a)**, **Safe Zone Monitor (b)**, hay **gộp (c)** "bám bắt người + giám sát vùng nguy hiểm"?
2. **Theo dõi chỉ người, hay bất kỳ object nào người dùng click?** (quyết định đường 1 vs đường 2)
3. Model thầy gợi ý cho bám bắt: **FastSAM / MobileSAM / EdgeSAM / SAM 2 / YOLO-seg**? Có yêu cầu chạy realtime trên CPU laptop không?
4. "Chọn object ở khung đầu" — chọn bằng **click chuột** hay khung bao?
5. Yêu cầu "bám bắt khi che khuất/đổi dạng/chạy nhanh" có **ngưỡng đánh giá** cụ thể nào (ví dụ che ≥ N giây vẫn bám được)?
6. Nếu gộp (c): cảnh báo vùng/loa ESP32 có được giữ làm ứng dụng không?
7. Ngưỡng phát hiện `conf=0.35` + 3 khung liên tiếp: chốt cố định hay đo A/B/C rồi chọn?
8. Đánh giá A/B/C: tối thiểu 100 lượt thử có đủ? Cách gán nhãn ground truth thầy gợi ý?
9. Ảnh minh chứng (bảo mật): bật hay tắt? Lưu 7 ngày hợp lý?
10. Giao tiếp backend ↔ ESP32: push HTTP đủ, hay nên MQTT (chuẩn bị VPS/nhiều loa)?

---

## 8. Danh sách mua linh kiện (mai đi mua, theo `phuonganlam.md` §5)

| Món | SL | Giá tham khảo | Lưu ý |
|---|---|---|---|
| ESP32 DevKit V1 30 chân CH340, USB-C | 1 | 125.000đ | Có mạch nạp USB; kiểm tra laptop có cổng USB-C |
| MAX98357A (khuếch đại I2S) | 1 | 40.000đ | Chọn module có header hàn sẵn |
| Loa 8Ω 3W có vỏ | 1 | 40.000đ | Kiểm tra đầu nối PH2.0 |
| Breadboard 400 lỗ | 1 | 20.000đ | |
| Dây Dupont đực-cái 40 sợi | 1 | 30.000đ | |
| **Tổng** | | **255.000đ** | + cáp USB-C/đồ hàn/ship → 310–365.000đ, trần 500.000đ |

**KHÔNG mua:** ESP32-CAM, HC-SR04, micro INMP441, màn TFT/OLED, còi, bộ chatbot. Webcam + laptop đã có.

---

## 9. Kế hoạch tiếp theo (sau khi thầy chốt)

- Thầy chốt (c) + đường 1 (person) → mình đổi `yolo11n.pt` sang `yolo11n-seg.pt`, thêm click chọn track_id, giữ vùng + cảnh báo. Nhanh.
- Thầy chốt (c) + đường 2 (any object) → mình tích hợp FastSAM + tracker, click object bất kỳ → bám mask. Công ~1 tuần.
- Thầy chốt (a) thuần tracking → Safe Zone Monitor làm phụ, tập trung tracking.
- Sau: đo A/B/C, FPS, độ trễ thật → `evaluation/` (không bịa số).
- Lộ trình mở rộng (Zone editor, mobile push, WiFi QR provisioning) ghi ở `docs/roadmap.md`.

> **Chưa code gì cho phần tracking** trước khi thầy chốt. Sáng mai nghiên cứu file này, ghi câu trả lời thầy lại, rồi mình điều chỉnh `docs/phuonganlam.md` + `AGENTS.md` + roadmap cho khớp.