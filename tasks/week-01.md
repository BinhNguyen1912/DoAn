# Tuần 1 — Nền tảng

- [x] Xác minh cấu hình laptop: CPU, GPU, dung lượng trống (i7-1195G7, 16 GB; GPU không dùng được cho YOLO → chạy CPU)
- [x] Cài Python, `ultralytics`, `opencv-python`; chạy lệnh thử `yolo predict ... source=0 classes=0` (chạy trên Windows, venv riêng của WSL gây lỗi Access denied phải tạo lại)
- [ ] Xác nhận chỉ số webcam (0 hay 1), độ phân giải, FPS thực (index 0, báo 640x480 @ 30 FPS; chưa chắc đây là chế độ cao nhất — cần set thử 1080p khi viết camera.py)
- [ ] Đo FPS và độ trễ ở `imgsz` 640, 416, 320 trên CPU (đã đo 640 trên webcam thật: inference ~46–53 ms ≈ 20 FPS; còn thiếu 416, 320 và độ trễ đầu-cuối)
- [ ] Chốt vị trí đặt camera và vùng nguy hiểm mô phỏng; chụp ảnh tham chiếu
- [ ] Kiểm tra đầu nối loa, chân module amp rồi đặt linh kiện (ESP32, MAX98357A, loa, breadboard, dây)
- [ ] Ghi số đo vào `evaluation/`
