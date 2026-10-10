# Việc cần làm khi chuyển sang máy khác

Tick `[x]` khi làm xong trên máy mới. Mục tiêu: máy mới chạy lại được giống máy cũ.

## 0. Lần đầu đẩy lên GitHub (làm trên máy cũ)

Thư mục này **chưa phải git repo** tại thời điểm viết (10/10/2026).

- [ ] `git init` và kiểm tra `git status`: không có `.env`, `*.pt`, `*.onnx`, clip, `.venv`, `node_modules`
- [ ] Quyết định có đưa file mẫu `docs/05 Mau theo doi ... .docx` lên Git không (có thông tin cá nhân của một sinh viên khác)
- [ ] Quyết định repo để private hay public (có file nhật ký mang tên và lớp của bạn)
- [ ] Commit, tạo repo trên GitHub, push (chỉ khi bạn chủ động yêu cầu)

## 1. Lấy source

- [ ] `git clone <url-repo>`
- [ ] Mở `AGENTS.md` trước; nó chứa mục tiêu, quyết định và trạng thái dự án

## 2. Những thứ KHÔNG nằm trong Git (phải làm lại tay)

| Thứ | Vì sao không có | Việc cần làm |
| --- | --- | --- |
| `.pi/` (cài package skill) | Nằm trong `.gitignore` | Chạy lệnh ở mục 3 |
| `.pi/agents/` (7 vai trò) | Cùng lý do | Chép từ máy cũ, hoặc chạy `/setup-pi-myself` trong pi |
| `.env` | Chứa cấu hình riêng | Copy `.env.example` thành `.env`, điền lại giá trị |
| Model `.pt` / `.onnx` | Quá nặng, bị ignore | Tải lại `yolo26n.pt` vào `apps/edge-ai/models/` |
| `docs/05 Mau*.docx` (mẫu của trường) và `docs/Nhat-ky-do-an-*.docx` | Chứa thông tin cá nhân; repo public nên bị ignore | Chép tay từ máy cũ hoặc xin lại file mẫu của trường |
| Clip và nhãn trong `evaluation/` | Có hình người, bị ignore | Chép tay từ máy cũ nếu cần |
| `.venv`, `node_modules`, `dist`, `build` | Sinh lại được | Cài lại theo từng app |
| Ảnh sự kiện do backend lưu | Dữ liệu chạy thử | Không cần; sinh lại khi chạy |

## 3. Cài pi và skill

- [ ] Cài pi (CLI `pi`) trên máy mới
- [ ] Chạy ở thư mục gốc và ở từng app muốn dùng pi (`apps/backend`, `apps/web`, `apps/mobile`, `apps/edge-ai`):

```bash
pi install -l git:github.com/MinhDuyDEV/pi-myself
```

- [ ] Chép `.pi/agents/` (hoặc `/setup-pi-myself`). Các file agent ghi tên model theo nhà cung cấp trên máy cũ; nếu máy mới không có nhà cung cấp đó thì sửa dòng `model:` trong từng file
- [ ] Đăng nhập/cấu hình nhà cung cấp model cho pi trên máy mới
- [ ] Nếu cần tracker/triage: chạy `/skill:setup-matt-pocock-skills` (tạo `docs/agents/*`)

## 4. Công cụ theo từng tuần

Chỉ cài khi đến tuần cần dùng.

- [ ] **Tuần 1 – Edge AI:** Python, `python -m venv .venv`, `pip install -r apps/edge-ai/requirements.txt` (cần bổ sung `ultralytics`, `opencv-python`, `numpy`, `httpx` vào file này khi bắt đầu viết mã)
- [ ] Cho phép terminal/IDE truy cập webcam (macOS: Cài đặt → Quyền riêng tư → Camera); kiểm tra chỉ số webcam 0 hay 1
- [ ] **Tuần 2 – ESP32:** Arduino IDE hoặc PlatformIO, gói Arduino-ESP32, driver USB CH340 cho ESP32 DevKit V1, plugin tải dữ liệu LittleFS
- [ ] **Tuần 4 – Backend:** Node LTS (chọn bản vừa Nest CLI vừa Vite), PostgreSQL, `npm install` trong `apps/backend`
- [ ] **Tuần 6 – Web:** `npm install` trong `apps/web`

## 5. Kiểm tra máy mới chạy được

- [ ] Webcam đọc được và chạy `yolo predict model=yolo26n.pt source=0 classes=0 device=cpu imgsz=640 show=True`
- [ ] ESP32 hiện cổng serial và nạp được chương trình mẫu
- [ ] PostgreSQL kết nối được bằng `DATABASE_URL`
- [ ] Máy mới và ESP32 cùng mạng LAN; cập nhật `ESP32_BASE_URL` theo IP hiện tại (nên đặt DHCP reservation)

## 6. Sau khi làm xong trên máy mới

- [ ] Cập nhật mục 6 "Trạng thái hiện tại" trong `AGENTS.md` nếu trạng thái thay đổi
- [ ] Tick tiến độ trong `tasks/week-XX.md`
- [ ] Nhớ: số đo FPS và độ trễ phụ thuộc phần cứng. Đo lại trên máy mới và ghi rõ tên máy vào `evaluation/`; không dùng lại số đo của máy khác
- [ ] Muốn xuất nhật ký đồ án: nói "xuất nhật ký" (xem mục 7 của `AGENTS.md`)
