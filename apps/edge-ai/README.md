# Edge AI

Python service: `src/camera.py` đọc webcam; `src/detector.py` chạy YOLO (person) + ByteTrack; `src/zone.py` xét đa giác; `src/alert_state.py` máy trạng thái chống báo lặp; `src/api_client.py` gửi sự kiện tới backend; `src/main.py` ghép luồng. Model `.pt` tải riêng, không đưa lên Git.

## Lệnh (chạy từ gốc repo `D:\DoAn`)

```bash
npm run edge:run      # pipeline thật: webcam → detect → vùng → POST /api/events + xem trước
npm run edge:fake     # bắn 1 sự kiện giả (test liên kết, không cần webcam)
npm run cam           # detect person thô bằng Ultralytics CLI (kiểm tra webcam/model)
npm run cam:probe     # list các index webcam hoạt động
```

## Cấu hình (`apps/edge-ai/.env`)

- `API_BASE_URL`, `EDGE_API_TOKEN` (phải khớp `EDGE_API_TOKEN` ở `apps/backend/.env`), `ZONE_ID`
- `CAMERA_INDEX` (mặc định 0; nếu lỗi mở cam thì chạy `npm run cam:probe` để tìm index đúng)
- `MODEL_PATH`, `DETECT_CONFIDENCE` (0.35), `IMAGE_SIZE` (640), `CONFIRM_FRAMES` (3), `COOLDOWN_SECONDS` (10)

## Luồng (AGENTS.md §2)

```
webcam → YOLO person + ByteTrack → điểm giữa cạnh đáy khung bao
       → cv2.pointPolygonTest với đa giác vùng (tọa độ chuẩn hóa)
       → máy trạng thái OUTSIDE→CANDIDATE→ALERTED→EXITED (3 khung liên tiếp)
       → POST /api/events (idempotent theo eventId)
```

## Kiểm thử

```bash
cd apps/edge-ai && uv run pytest        # test_alert_state + test_zone + test_config
```

Máy trạng thái và đa giác là logic thuần, có unit test. Ngưỡng `conf=0.35`, 3 khung, `imgsz=640` là **giá trị khởi đầu cần đo lại** trên laptop thật (tuần 1, 7).