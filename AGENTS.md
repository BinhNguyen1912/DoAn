# Safe Zone Monitor — Hướng dẫn cho agent

File này là bộ nhớ của dự án: agent mở repo trên máy mới đọc file này trước để biết mục tiêu, quyết định đã chốt và việc đang làm.

## 1. Đây là dự án gì

Đồ án tốt nghiệp (mẫu theo dõi của Phân hiệu Trường Đại học Thủy Lợi): **hệ thống giám sát vùng nguy hiểm bằng Edge AI và cảnh báo giọng nói tiếng Việt**. Đây là nguyên mẫu học thuật, **không** phải thiết bị bảo vệ trẻ em được chứng nhận.

Webcam nhìn một vùng nguy hiểm mô phỏng. Khi có người bước vào, loa ESP32 phát một câu cảnh báo tiếng Việt ghi sẵn. Dashboard web hiển thị sự kiện và trạng thái loa.

Người dùng làm một mình hoặc theo nhóm nhỏ, thời gian **8 tuần**, báo cáo tiến độ cho giảng viên hướng dẫn mỗi tuần. Người dùng giao tiếp bằng tiếng Việt; trả lời bằng tiếng Việt.

## 2. Luồng hoạt động

```
Webcam → Edge AI (laptop) → POST /api/events → Backend NestJS + PostgreSQL
       → POST /alert (LAN) → ESP32 + MAX98357A + loa phát WAV
       → ACK về backend → Dashboard React
```

1. OpenCV đọc từng khung hình vào RAM trên laptop. **Khung hình không rời laptop**; không gửi lên cloud, R2 hay Drive.
2. YOLO (`yolo26n.pt`, chỉ lớp `person`) + ByteTrack phát hiện và theo dõi người.
3. Lấy **điểm giữa cạnh đáy khung bao**, kiểm tra nằm trong đa giác vùng bằng `cv2.pointPolygonTest`. Vùng lưu tọa độ chuẩn hóa.
4. Máy trạng thái `OUTSIDE → CANDIDATE → ALERTED → EXITED`. Đủ 3 khung liên tiếp trong vùng mới tạo sự kiện. Báo lại chỉ khi người rời rồi vào lại, hoặc sau cooldown. Chống lặp dựa vào trạng thái vùng, không chỉ `track_id`.
5. Backend lưu sự kiện, gọi ESP32, ghi từng bước vào `alert_attempt`.
6. ESP32 phát WAV từ flash và báo trạng thái. **Năm trạng thái:** đã gửi, đã nhận, bắt đầu phát, phát xong, thất bại. HTTP gửi thành công không có nghĩa là loa đã phát.

## 3. Cấu trúc thư mục

| Đường dẫn | Vai trò |
| --- | --- |
| `apps/edge-ai/` | Python: `camera`, `detector`, `zone`, `alert_state`, `api_client`, `main` |
| `apps/backend/` | NestJS + PostgreSQL; module `zones`, `events`, `devices`, `alerts` |
| `apps/web/` | React + Vite dashboard một trang |
| `apps/mobile/` | Chỗ dành sẵn, ngoài MVP |
| `iot/esp32-alert/` | Firmware Arduino-ESP32 riêng (`WiFi.h`, `WebServer.h`, `LittleFS.h`, `ESP_I2S.h`) |
| `iot/xiaozhi-source/` | Mã tham khảo, **không sửa** |
| `docs/` | `phuonganlam.md` (phương án chốt), `architecture.md`, `api-contract.md`, `bao-cao-tien-do-tuan.md`, file mẫu theo dõi đồ án của trường |
| `tasks/` | Kế hoạch 8 tuần: `README.md` và `week-01.md` … `week-08.md` |
| `GLOSSARY.md` | Thuật ngữ thống nhất |
| `hardware/`, `evaluation/` | Sơ đồ/linh kiện; clip, nhãn, kết quả đo |

## 4. Quyết định đã chốt

- Phần cứng đã có: laptop MSI Modern 14 i7, RAM 16 GB, SSD 256 GB; webcam USB 1080p. Cần mua: ESP32 DevKit V1, MAX98357A, loa 8Ω 3W, breadboard, dây Dupont (khoảng 255.000đ, trần dự phòng 500.000đ).
- Không dùng ESP32-CAM, HC-SR04, micro, màn TFT/OLED, chatbot, LLM trong đường cảnh báo.
- Model chỉ nhận diện `person`; không xác định tuổi hay danh tính. Câu cảnh báo dùng "có người trong vùng nguy hiểm", không tuyên bố phát hiện trẻ em.
- Không nạp nguyên firmware Xiaozhi `.bin`. Chỉ tham khảo cấu hình chân ESP32 và mã I2S sau khi đối chiếu bo mạch thật.
- **Ảnh minh chứng:** tắt mặc định, bật bằng cấu hình, chỉ lưu khi có sự kiện. Edge AI gửi JPEG kèm sự kiện (multipart) tới backend; backend lưu file trên laptop, DB chỉ giữ đường dẫn. Giữ 7 ngày rồi tự xoá. Clip thử trong `evaluation/` xoá thủ công sau khi nộp.
- **Telegram/điện thoại:** ngoài MVP. Backend tách "kênh thông báo" để cắm thêm sau. Mặc định chỉ gửi văn bản; gửi ảnh ra ngoài phải bật chủ động và chỉ với người tình nguyện đồng ý.
- Ngưỡng khởi đầu `conf=0.35`, 3 khung liên tiếp, `imgsz=640` là **giá trị cần đo lại**, chưa được kiểm chứng.
- Đánh giá so sánh 3 cấu hình trên cùng dữ liệu: **A** thấy người là báo; **B** thêm kiểm tra vùng; **C** thêm tracking, nhiều khung, chống lặp. Chênh lệch B và C là đóng góp kỹ thuật cần chứng minh. Tối thiểu 100 lượt thử có nhãn.
- Giấy phép: Ultralytics là AGPL-3.0; Xiaozhi giữ nguyên LICENSE. Ghi nguồn khi dùng.

## 5. Kế hoạch 8 tuần

Chi tiết trong `tasks/README.md` và `tasks/week-XX.md`; tick `[x]` khi xong.

| Tuần | Trọng tâm | Cổng chốt |
| :-: | --- | --- |
| 1 | Đo laptop, webcam, FPS, model; chốt vị trí camera và vùng; đặt linh kiện | |
| 2 | ESP32 phát WAV qua loa | Chưa rõ tiếng thì dừng tích hợp |
| 3 | Edge AI: phát hiện, tracking, đa giác, máy trạng thái | |
| 4 | Backend NestJS + PostgreSQL, viết `docs/api-contract.md` đầy đủ | |
| 5 | Tích hợp backend ↔ ESP32, ACK, chống trùng | Một sự kiện đi trọn webcam → loa → DB |
| 6 | Dashboard | |
| 7 | Thu dữ liệu có nhãn, so sánh A/B/C | |
| 8 | Thử lỗi, demo, báo cáo | |

Nếu trễ tiến độ, cắt theo thứ tự: ảnh minh chứng → chỉnh vùng trên dashboard (thay bằng file cấu hình) → trang thống kê. **Không cắt:** máy trạng thái chống lặp, ACK từ ESP32, thực nghiệm A/B/C.

Rủi ro lớn nhất là tuần 5 (nối bốn thành phần). Nên nối thô sớm từ tuần 3–4 bằng sự kiện giả.

## 6. Trạng thái hiện tại

- Đã có: gốc npm workspaces, backend NestJS 12 (ESM, Vitest, oxlint) với module cấu hình kiểm tra bằng Zod, `compose.yaml` Postgres 18 (dev: `127.0.0.1:55432`), project `uv` cho edge-ai (Python 3.12) với `config.py`. Chưa có: entity/migration, API, web, firmware, CI.
- Lệnh: `npm run backend:dev|build|test|lint` (gốc repo); `docker compose up -d db`; `cd apps/edge-ai && uv run pytest`; `node scripts/init-env.mjs`.
- Tại thời điểm viết (10/10/2026) chưa có tuần nào trong `tasks/` được tick. Cập nhật mục này khi tiến độ thay đổi.
- Chưa xác minh: cấu hình CPU/GPU và dung lượng trống của laptop; chân I2S, flash, đầu nối loa trên bo mạch thật; FPS thực của model.
- `docs/api-contract.md` mới là đề xuất, cần viết đầy đủ ở tuần 4 trước khi tích hợp.

## 7. Nhật ký đồ án (báo cáo tuần cho giảng viên)

**Sinh viên:** Nguyễn Anh Bình, lớp K64-S25 CNTT. Chưa có: ngày sinh, nơi sinh, dân tộc, hệ đào tạo, điểm TBHT, tên giảng viên hướng dẫn — hỏi người dùng, không tự điền.

**Khi người dùng nói "xuất nhật ký":** tạo file Word theo mẫu của trường và lưu vào `docs/` (tên `Nhat-ky-do-an-Nguyen-Anh-Binh.docx`; ghi đè bản cũ cùng tên). Các bước:

1. Lấy bản sao của `docs/05 Mau theo doi qua trinh lam do an tot nghiep-*.docx` làm nền. Không sửa file mẫu gốc.
2. Thay thông tin sinh viên (họ tên, lớp, tên đề tài, thời gian thực hiện) bằng của Nguyễn Anh Bình. Các trường chưa biết để trống.
3. Điền Phần II mục 2: bảng 4 cột **TT | Ngày/tháng | Phần thiết kế ĐATN | Nhận xét, đánh giá**; mỗi tuần một dòng, các việc xuống dòng trong cùng một ô; cột nhận xét do giảng viên điền, để trống; xoá dòng thừa của mẫu cũ.
4. Nội dung từng tuần lấy từ `tasks/week-XX.md` (mục đã tick) và từ điều người dùng báo là đã làm. **Chỉ ghi việc đã làm thật**; tuần chưa làm để trống hoặc ghi rõ là kế hoạch.
5. Ngày tháng theo lịch thật của người dùng; hỏi nếu chưa biết ngày bắt đầu tuần 1.
6. Phần III, IV của mẫu để nguyên.

Môi trường không có `python-docx` hay `pandoc`; sửa trực tiếp `word/document.xml` trong gói `.docx` bằng `zipfile` và giữ nguyên định dạng. Sau khi xuất, kiểm tra lại bằng cách đọc ngược nội dung file. Bản nháp dạng Markdown nằm ở `docs/bao-cao-tien-do-tuan.md`, ngày tháng trong đó chỉ là giả định tuần 1 bắt đầu 12/10/2026.

## 8. Ranh giới bắt buộc

- Không sửa `iot/xiaozhi-source/`.
- AI chạy cục bộ; không gửi khung hình lên cloud.
- Không commit: `.env`, model `.pt`/`.onnx`, clip và nhãn trong `evaluation/`. Chỉ `.env.example` được commit.
- Cấu hình qua biến môi trường, không hard-code IP, mật khẩu. Mỗi app có `.env.example` (commit) và `.env` (ignore); chạy `node scripts/init-env.mjs` để tạo. Thêm biến mới: sửa schema (`apps/backend/src/config/env.schema.ts`, `apps/edge-ai/src/config.py`) và `.env.example` cùng lúc; app dừng khi cấu hình sai. Firmware dùng `secrets.h` (ignore).
- Không bịa số liệu hiệu năng; ngưỡng, FPS, độ trễ, bỏ sót/báo nhầm phải đo trên laptop thật và ghi vào `evaluation/`.
- Token thiết bị và API chỉ dùng trong LAN thử nghiệm.

## 9. Quy ước

- Mã và comment bằng tiếng Anh; tài liệu và nội dung hiển thị cho người dùng bằng tiếng Việt.
- Dùng đúng thuật ngữ trong `GLOSSARY.md` (Vùng, Sự kiện, Lệnh cảnh báo, Lần phát, Ảnh minh chứng, Kênh thông báo).
- Đổi payload hoặc route phải cập nhật `docs/api-contract.md` cùng lúc và nêu thành phần bị ảnh hưởng (edge-ai, backend, web, ESP32).
- Khi khởi tạo một app: cập nhật README của app, bảng trạng thái trong `README.md` gốc, mục 6 của file này, và thêm lệnh build/test vào đây.
- Commit theo conventional commits có scope (`edge-ai`, `backend`, `web`, `esp32`, `docs`). Chỉ commit/push khi người dùng yêu cầu.

## 9b. Quy tắc commit và push

Remote: `origin` = `https://github.com/BinhNguyen1912/DoAn.git`, nhánh `main`, repo **public**.

**Quy tắc chi tiết (nhánh, PR, kiểm tra trước khi push, đặt tên commit, review) chưa được thiết lập; người dùng sẽ tự thiết lập sau.** Khi người dùng cung cấp, ghi vào mục này và bỏ dòng này.

Trong lúc chờ:
- Không commit hay push khi người dùng chưa yêu cầu rõ trong lượt đó.
- Không đẩy `.env`, model, clip hay file chứa thông tin cá nhân (xem `.gitignore`). Repo public nên kiểm tra `git status` trước khi push.
- Không force-push, không đổi lịch sử `main`, không đổi chế độ public/private của repo.

## 10. Thiết lập trên máy mới

Danh sách đầy đủ nằm ở `SETUP-MAY-MOI.md`; đọc file đó khi chuyển máy. Tóm tắt:

`.pi/` nằm trong `.gitignore`, nên sau khi clone cần cài lại package skill. Chạy trong thư mục gốc và trong từng app muốn dùng pi:

```bash
pi install -l git:github.com/MinhDuyDEV/pi-myself
```

Thư mục `.pi/agents/` (7 vai trò) cũng không được commit; chép lại từ máy cũ hoặc chạy `/setup-pi-myself` trong pi. Dự án không có skill riêng. Cấu hình tracker/triage (`docs/agents/*`) chưa có; chạy `/skill:setup-matt-pocock-skills` khi cần.

Trên máy mới, cài Python (cho `ultralytics`, `opencv-python`, `numpy`, `httpx`), Node LTS (NestJS, Vite), PostgreSQL và Arduino-ESP32 khi đến tuần tương ứng.
