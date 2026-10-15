# Danh sách linh kiện đề xuất (để thầy chốt quy mô)

**Đề tài:** Giám sát vùng nguy hiểm bằng Edge AI + cảnh báo giọng nói tiếng Việt qua ESP32.
**Ngày:** 15/10/2026. Giá niêm yết tham khảo 10/10/2026, có thể thay đổi.

## A. Đã có (không mua)

| Món | Vai trò |
|---|---|
| Laptop MSI Modern 14 i7, RAM 16 GB | Chạy Edge AI (YOLO), backend, web |
| Webcam USB 1080p | Quan sát vùng nguy hiểm |

## B. Đề xuất mua (đợt này)

| Món | SL | Giá tham khảo | Vai trò | Lưu ý khi mua |
|---|---|---|---|---|
| ESP32 DevKit V1 30 chân CH340, USB-C | 1 | 125.000đ | Nhận lệnh Wi-Fi, phát âm thanh | Có mạch nạp USB; kiểm tra laptop có cổng USB-C |
| MAX98357A (khuếch đại I2S) | 1 | 40.000đ | Khuyếch đại âm thanh số → loa | Chọn module có header hàn sẵn |
| Loa 8Ω 3W có vỏ | 1 | 40.000đ | Phát câu cảnh báo tiếng Việt | Kiểm tra đầu nối PH2.0 |
| Breadboard 400 lỗ | 1 | 20.000đ | Thử mạch | |
| Dây Dupont đực-cái 40 sợi | 1 | 30.000đ | Nối tạm | |
| **Tổng** | | **255.000đ** | | + cáp USB-C/đồ hàn/ship → 310–365.000đ, trần 500.000đ |

## C. Đề xuất KHÔNG mua (giữ quy mô MVP)

ESP32-CAM, HC-SR04 (cảm biến siêu âm), micro INMP441, màn TFT/OLED, còi rời, bộ chatbot trọn gói. Webcam + laptop đã đảm nhiệm camera; câu nói ghi sẵn nên không cần micro.

## D. Câu hỏi thầy chốt

1. Quy mô phần cứng như mục **B** (1 ESP32 + 1 loa) là đủ cho đồ án, hay thầy muốn mở rộng (nhiều loa, thêm cảm biến)?
2. Dòng ESP32: DevKit V1 (CH340) có phù hợp, hay thầy yêu cầu ESP32-S3 / ESP32-C3 / ESP32-C6?
3. Có nên giữ **MAX98357A + loa 3W** để phát tiếng Việt, hay thầy muốn cảnh báo bằng cách khác (còi, LED, màn hình)?
4. Mục **C** (không mua) thầy đồng ý bỏ, hay muốn thêm thứ nào (ví dụ cảm biến khoảng cách, màn OLED)?
5. Webcam USB sẵn có đủ, hay thầy muốn dùng ESP32-CAM (camera trên ESP32)? *(Mình khuyên giữ webcam USB + Edge AI trên laptop cho chất lượng nhận diện tốt hơn.)*