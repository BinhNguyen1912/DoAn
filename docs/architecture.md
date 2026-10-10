# Kiến trúc dự kiến

Webcam → Edge AI trên laptop → POST sự kiện → backend NestJS/PostgreSQL → lệnh LAN → ESP32 phát câu ghi sẵn → backend ghi trạng thái → web dashboard.

Model nhận diện lớp `person`, không xác định tuổi. Mobile là hướng mở rộng. Xem phương án chi tiết: https://docs.google.com/document/d/1FprXMsuWw5_Uy6QIymV7EYPmksZGyVr5FPYUb-WJ0ag/edit
