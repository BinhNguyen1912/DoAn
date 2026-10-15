# Số đo FPS suy luận trên CPU — máy MSI Modern 14

## Đo với webcam thật — lần 2 (14/10/2026, sau khi dựng venv Windows)

**Nguồn:** webcam index 0, OpenCV báo `640x480 @ 30 FPS` (chưa chắc là chế độ cao nhất của camera).
**Model:** `yolo11n.pt`, `classes=0`, `imgsz=640`, `device=cpu`, qua `yolo predict ... show=True`.
**Kết quả:** inference ổn định **46–53 ms/khung ≈ 20 FPS** — khớp lần đo trên ảnh giả (46 ms).
**Kết luận:** máy đủ chạy realtime trên CPU; không cần GPU hay ONNX.

**Quan sát chất lượng:**
- Người thật bị nhận diện tốt.
- **Báo nhầm:** ly nước bị gán nhãn `person` ở ngưỡng mặc định (conf ≥ 0.25) — chưa ghi được confidence cụ thể của vật báo nhầm; cần thử lại với `conf=0.5`/`0.6` và đo lại xem người thật còn giữ được không. Giá trị `conf=0.35` trong phương án là ước lượng ban đầu, chưa kiểm chứng.
- Camera mặc định lấy 640x480, không phải 1080p — cần kiểm tra các resolution camera hỗ trợ thật khi viết `camera.py`.

**Cần làm tiếp để tuần 1 chốt:** đo 416/320, độ trễ đầu-cuối, chốt ngưỡng conf, chốt vị trí camera + vùng.

## Đo suy luận CPU trên ảnh giả — lần 1 (tuần 1, chưa hoàn chỉnh)

**Máy:** MSI Modern 14 — Intel i7-1195G7 @ 2.90 GHz, 8 nhân (WSL2, Ubuntu), RAM 16 GB.
**Model:** `yolo11n.pt` (bản sẵn có, 6.4 MB), chỉ lớp `person` (`classes=0`), `conf=0.35`, `device=cpu`.
**Ảnh thử:** khung 1080p đơn sắc (không người), đo trung bình 5 khung sau 3 khung warm-up.
**Cách đo:** Python trực tiếp `model.predict(...)`, không đọc camera.

| imgsz | ms/khung | FPS |
| ---: | ---: | ---: |
| 640 | 46 | ~22 |
| 416 | 35 | ~29 |
| 320 | 28 | ~36 |

**Ghi chú:**

- Khung đầu tiên sau khi nạp model mất ~14 s (khởi tạo một lần của PyTorch); mọi số đo đều lấy sau warm-up.
- Chưa phải số đo chính thức cho `tasks/week-01.md`: ảnh là ảnh giả, chưa qua GPU/ONNX, chưa đo với luồng webcam thực, chưa có độ trễ đầu-cuối.
- Cần đo lại trên video thật (clip trong `evaluation/clips/`) và ghi thêm kết quả bỏ sót/báo nhầm.
- Lần đo: lần đầu khởi tạo môi trường trên máy này (uv sync, ultralytics 8.4.175).