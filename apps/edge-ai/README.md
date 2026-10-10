# Edge AI

Python service dự kiến: `src/camera.py` đọc webcam; `src/detector.py` chạy model; `src/zone.py` xét đa giác; `src/alert_state.py` chống báo lặp; `src/api_client.py` gửi sự kiện tới backend; `src/main.py` ghép luồng. Model `.pt` tải riêng một lần và không đưa lên Git.

Thử model ban đầu: `yolo predict model=yolo26n.pt source=0 classes=0 device=cpu imgsz=640 show=True`. Đây là bước kiểm tra webcam/model, chưa phải hệ thống cảnh báo. Chọn ngưỡng, FPS và độ trễ sau khi đo trên laptop thật.
