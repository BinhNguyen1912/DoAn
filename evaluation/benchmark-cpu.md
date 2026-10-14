# Đo FPS suy luận trên CPU — lần đo đầu (tuần 1, chưa hoàn chỉnh)

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