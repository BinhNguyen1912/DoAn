# ESP32 alert firmware

Firmware riêng của đồ án sẽ kết nối Wi-Fi LAN, nhận `POST /alert` với `event_id`, phát một tệp tiếng Việt ghi sẵn từ flash qua I2S/MAX98357A và trả trạng thái. Dự kiến dùng Arduino-ESP32 (`WiFi.h`, `WebServer.h`, `LittleFS.h`, `ESP_I2S.h`). Chưa có mã biên dịch vì pin, phân vùng flash và bo mạch mua thực tế chưa được xác minh.

Mã Xiaozhi gốc để tham khảo nằm ở `../xiaozhi-source/`, không phải firmware cảnh báo hoàn chỉnh.
