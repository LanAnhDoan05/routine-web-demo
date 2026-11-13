# Kịch bản demo Routine Web

## Trạng thái trước demo

- MySQL và frontend/backend đã được smoke test; không dùng dữ liệu giả.
- Gemini live hiện trả HTTP 504, vì vậy không trình bày phần trả lời Gemini như đã chạy thành công. Sau khi xác nhận model/quota, chạy lại kịch bản AI.
- Không demo tạo/sửa sản phẩm trên DB thật nếu chưa có backup đầy đủ và tài khoản admin được cấp.

## 1. Kiểm tra website và backend

1. Mở trang chủ Routine.
2. Mở `/admin/products/new` để kiểm tra form sản phẩm.
3. Gọi `GET /api/v1/health`: kỳ vọng HTTP 200, DB connected, 37 sản phẩm.
4. Gọi `GET /api/v1/stores`: kỳ vọng HTTP 200.
5. Gọi `GET /api/v1/products/admin/all` khi chưa đăng nhập: kỳ vọng HTTP 401.

## 2. Kiểm chứng tool catalog trực tiếp

Các lệnh sau chạy handler backend đọc MySQL, không cần ghi dữ liệu:

1. **Tìm áo sơ mi trắng dưới 500.000đ** — catalog hiện có `Classic White Shirt` (`p003`) giá 339.000đ; không trả T-shirt thay cho áo sơ mi.
2. **Lấy chi tiết và size** — `p003` có màu Black/White/Navy, các size S–XL và tồn kho tổng 78. Catalog hiện chưa có tồn kho riêng từng size cho sản phẩm này.
3. **Phối đồ đi làm dưới 1.000.000đ** — smoke hiện tại trả `Silk Blend Blouse` (`p027`, 349.000đ) và `Straight Fit Jeans` (`p005`, 549.000đ), tổng 898.000đ.
4. **Thay áo bằng áo sơ mi trắng** — giữ quần `p005`, thay bằng `p003`; tổng 888.000đ.

Các kết quả này xác nhận tool/backend truy vấn catalog thật; chưa xác nhận Gemini tự gọi tool do API timeout.

## 3. Kịch bản hội thoại khi Gemini khả dụng

1. “Tìm cho tôi áo sơ mi trắng dưới 500.000 đồng.”
2. “Phối cho tôi một bộ đồ đi làm dưới 1 triệu.”
3. “Thay chiếc áo vừa rồi bằng một chiếc áo trắng.”
4. “Tôi chỉ muốn xem quần jeans.”
5. Hỏi size của một sản phẩm cụ thể và xác nhận câu trả lời không suy diễn tồn kho theo size nếu DB chỉ có tồn kho tổng.

**Tiêu chí đạt:** Gemini gọi đúng tool; sản phẩm, giá, ảnh, màu, size và tồn kho khớp MySQL; không phối đồ cho câu hỏi sản phẩm đơn lẻ; không bịa sản phẩm.

## 4. Kiểm thử Admin sau khi có điều kiện an toàn

Chỉ tiếp tục khi chủ dự án cấp quyền admin và xác nhận backup có cả LONGBLOB:

1. Tạo/sửa sản phẩm thử nghiệm được chủ dự án phê duyệt; dùng thông tin và ảnh đã xác minh.
2. Kiểm tra record ở DB, trang danh mục và chi tiết sản phẩm.
3. Kiểm tra upload/media URL trả HTTP 200.
4. Xóa/ẩn sản phẩm thử nghiệm chỉ khi có phê duyệt.

Hiện chưa thực hiện các thao tác ghi này.
