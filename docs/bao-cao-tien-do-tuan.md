# Bảng theo dõi tiến độ đồ án (Phần II, mục 2)

Theo mẫu `05 Mau theo doi qua trinh lam do an tot nghiep`: cột 4 "Nhận xét, đánh giá" do giảng viên hướng dẫn ghi, để trống.

**Sinh viên:** Nguyễn Anh Bình, lớp K64-S25 CNTT

**Tên đề tài:** Xây dựng hệ thống giám sát vùng nguy hiểm bằng Edge AI và cảnh báo giọng nói tiếng Việt qua ESP32.

> Ngày tháng bên dưới giả định tuần 1 bắt đầu thứ Hai 12/10/2026. Sửa lại cho khớp lịch thật. Nội dung là kế hoạch; sau mỗi tuần sửa lại cho đúng việc đã làm.

| TT | Ngày/tháng | Phần thiết kế ĐATN | Nhận xét, đánh giá |
|:-:|---|---|---|
| 1 | 12/10/2026 – 18/10/2026 | Khảo sát cấu hình laptop và webcam. <br>Cài đặt Python, Ultralytics YOLO, OpenCV. <br>Chạy thử mô hình phát hiện người trên webcam. <br>Đo FPS và độ trễ ở các kích thước ảnh 640, 416, 320. <br>Chọn vị trí đặt camera và vùng nguy hiểm mô phỏng. <br>Đặt mua linh kiện (ESP32, MAX98357A, loa). | |
| 2 | 19/10/2026 – 25/10/2026 | Nối mạch ESP32, MAX98357A và loa. <br>Tìm hiểu Wi-Fi, LittleFS, I2S trên Arduino-ESP32. <br>Chuẩn bị tệp âm thanh cảnh báo tiếng Việt. <br>Lập trình ESP32 phát âm thanh từ bộ nhớ flash. <br>Vẽ sơ đồ nối dây. | |
| 3 | 26/10/2026 – 01/11/2026 | Lập trình đọc webcam và phát hiện người bằng YOLO. <br>Theo dõi đối tượng bằng ByteTrack. <br>Xét người có nằm trong vùng đa giác hay không. <br>Xây dựng máy trạng thái chống báo lặp. <br>Xuất video minh họa có khung bao và vùng. | |
| 4 | 02/11/2026 – 08/11/2026 | Thiết kế hợp đồng API giữa các thành phần. <br>Xây dựng backend NestJS và cơ sở dữ liệu PostgreSQL. <br>Lập trình nhận và lưu sự kiện từ Edge AI. <br>Xây dựng API vùng, sự kiện, thiết bị. | |
| 5 | 09/11/2026 – 15/11/2026 | Lập trình ESP32 nhận lệnh cảnh báo và xác nhận trạng thái phát. <br>Backend gửi lệnh tới ESP32, ghi nhận kết quả, chống lệnh trùng. <br>Kiểm tra toàn luồng từ webcam đến loa. <br>Lưu ảnh sự kiện (tùy chọn). | |
| 6 | 16/11/2026 – 22/11/2026 | Xây dựng giao diện web bằng React. <br>Chỉnh sửa vùng nguy hiểm trên ảnh tham chiếu. <br>Hiển thị lịch sử sự kiện và trạng thái thiết bị. | |
| 7 | 23/11/2026 – 29/11/2026 | Thu thập dữ liệu thử có gán nhãn (từ 100 lượt). <br>So sánh ba cấu hình: chỉ phát hiện người, thêm kiểm tra vùng, thêm tracking và chống lặp. <br>Đo độ chính xác, báo nhầm, FPS và độ trễ. <br>Hiệu chỉnh ngưỡng theo kết quả đo. | |
| 8 | 30/11/2026 – 06/12/2026 | Thử các tình huống lỗi: mất Wi-Fi, tắt backend, tắt ESP32, thiếu sáng. <br>Chạy demo toàn hệ thống. <br>Hoàn thiện báo cáo tổng kết, sơ đồ mạch và video minh họa. | |

## Cần bạn kiểm tra khi chuyển sang file Word
- Thông tin sinh viên trong file mẫu hiện là của người khác và đề tài cũ. Cần thay bằng Nguyễn Anh Bình, K64-S25 CNTT; ngày sinh, nơi sinh, dân tộc, hệ đào tạo, điểm TBHT và tên đề tài chính thức còn thiếu.
- File mẫu có 14 dòng tuần; kế hoạch này có 8 dòng. Xóa các dòng thừa, hoặc cho biết thầy yêu cầu đủ 14 tuần.
- Trong mẫu, các dòng của cùng một tuần xuống dòng trong một ô; ở đây dùng `<br>`.
