# Safe Zone Monitor

Hệ thống phát hiện người đi vào một vùng nguy hiểm mô phỏng và phát cảnh báo bằng giọng nói tiếng Việt.

## Language

**Vùng (Zone)**:
Đa giác tọa độ chuẩn hóa trên ảnh camera, đánh dấu khu vực không được có người.
_Avoid_: Khu vực, region, area

**Sự kiện (Event)**:
Một lần người đi vào vùng, được xác nhận qua nhiều khung hình liên tiếp. Mỗi sự kiện có một `event_id` duy nhất.
_Avoid_: Cảnh báo, báo động, incident

**Lệnh cảnh báo (Alert command)**:
Yêu cầu backend gửi tới ESP32 để phát một câu ghi sẵn cho một sự kiện.
_Avoid_: Cảnh báo, thông báo

**Lần phát (Alert attempt)**:
Một lần backend cố gắng phát lệnh cảnh báo, cùng kết quả: đã gửi, đã nhận, bắt đầu phát, phát xong hoặc thất bại.
_Avoid_: Lần gửi, lần báo

**Ảnh minh chứng (Evidence image)**:
Ảnh chụp tại thời điểm xảy ra sự kiện, chỉ tồn tại khi chế độ lưu ảnh được bật.
_Avoid_: Snapshot, ảnh chụp

**Kênh thông báo (Notification channel)**:
Đích mà backend gửi thông tin sự kiện tới. Hiện chỉ có loa ESP32; Telegram và điện thoại là kênh có thể thêm sau.
_Avoid_: Push, alert channel
