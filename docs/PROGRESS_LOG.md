# Nhật ký tiến độ Routine Web

## PHASE 1 — Backend và MySQL

- **File đã sửa:** `backend/src/services/stockReservationService.js`, `backend/src/services/productService.js`; kiểm tra các script migration/backup hiện có.
- **Đã làm:** Sửa việc map tồn kho khả dụng để lấy số lượng reservation theo batch và đợi kết quả trước khi tính `availableStock`. Giữ nguyên dữ liệu thật; không chạy migration, thêm/sửa/xóa sản phẩm hoặc ghi vào MySQL.
- **Lệnh/kiểm tra:** `npm --prefix backend run test:stock-reservations`; `npm --prefix backend run build`; gọi `GET /api/v1/health`, `GET /api/v1/stores`.
- **Kết quả:** 2/2 test reservation đạt; Prisma Client generate đạt; health HTTP 200, `dbStatus=connected`, `productCount=37`; stores HTTP 200. Kiểm tra chỉ đọc trước đó xác nhận 25 cửa hàng và 5 migration hoàn tất.
- **Còn tồn tại:** Báo cáo kiểm toán cũ ghi 38 sản phẩm và migration drift; số hiện tại là 37, trạng thái migration cũ không còn đúng. Script backup hiện có không lưu đầy đủ LONGBLOB của `media_files`, nên không coi là bản backup an toàn cho thay đổi DB.
- **Tiếp theo:** Trước mọi thao tác ghi DB, tạo và xác minh backup đầy đủ gồm cả media nhị phân.

## PHASE 2 — Frontend và Admin

- **File đã sửa:** `frontend/components/admin/ProductForm.jsx`, `frontend/components/admin/VariantEditor.jsx`.
- **Đã làm:** Bỏ giá trị mặc định tạo tồn kho/variant giả; các trường size, màu và tồn kho không được tự điền nếu không có dữ liệu. Build giao diện thành công.
- **Lệnh/kiểm tra:** `npm --prefix frontend run build`; `npm --prefix frontend run lint`; production HTTP smoke cho `/` và `/admin/products/new`; gọi endpoint sản phẩm admin khi chưa xác thực.
- **Kết quả:** Build đạt; lint 0 lỗi và 76 cảnh báo; trang chủ và form sản phẩm mới HTTP 200; `GET /api/v1/products/admin/all` không token trả 401.
- **Còn tồn tại:** Chưa đăng nhập admin hoặc tạo/sửa sản phẩm vì không có thông tin xác thực được cấp và đây là thao tác ghi DB. Ảnh `p003` tham chiếu tới `/uploads/prod_p003_1_1788764847560.webp` nhưng file không có ở hai thư mục uploads; frontend media proxy trả 404. Thư mục ảnh nguồn có 906 file/203 thư mục nhưng không có tên tệp/thư mục khớp mã hoặc tên sản phẩm để xác định liên kết an toàn.
- **Tiếp theo:** Có backup DB đầy đủ và quy tắc ánh xạ ảnh được xác nhận trước khi sửa sản phẩm hoặc media.

## PHASE 3 — Gemini AI Stylist

- **File đã sửa:** `backend/src/services/geminiService.js`, `backend/src/services/aiService.js`.
- **Đã làm:** Thêm đường gọi Gemini trả đầy đủ response để hỗ trợ function call; giữ đường sinh nội dung cũ. Tích hợp ưu tiên agent và giới hạn tự phối đồ khi khách chỉ hỏi một sản phẩm riêng lẻ.
- **Lệnh/kiểm tra:** Test đơn vị AI nằm trong nhóm test backend; gọi Gemini trực tiếp bằng model cấu hình, không in hoặc tiết lộ API key.
- **Kết quả:** Test mock đạt. Request trực tiếp với `gemini-3.5-flash` trả HTTP 504 `DEADLINE_EXCEEDED`; chưa xác nhận Gemini sinh function call hoặc câu trả lời trực tiếp thành công.
- **Còn tồn tại:** Dịch vụ/model Gemini là blocker vận hành; tool calling thực tế từ mô hình chưa được chứng minh.
- **Tiếp theo:** Kiểm tra quota/model trong tài khoản cấu hình và xác nhận model có thể gọi trước khi demo AI live.

## PHASE 4 — AI Agent và công cụ catalog

- **File đã thêm/sửa:** `backend/src/services/fashionAgentService.js`, `backend/src/services/fashionAgentTools.js`, `backend/src/services/aiService.js`, `backend/src/services/conversationService.js`; test cho tool calling và ngân sách.
- **Đã làm:** Khai báo sáu công cụ tra cứu catalog; chỉ dispatch qua handler cố định, giới hạn số lượt gọi, không cho mô hình viết SQL hoặc ghi DB. Lịch sử lưu product IDs để thay món. Sửa phân loại category tổng quát `ao`, loại trừ T-shirt khỏi tìm kiếm áo sơ mi, tránh ép bộ lọc `unisex` khi thay món và thử các cặp sản phẩm nằm trong ngân sách.
- **Lệnh/kiểm tra:** `npm --prefix backend run test:fashion-agent`; `npm --prefix backend run test:ai-outfit-budget`; smoke read-only trực tiếp qua handlers tới MySQL.
- **Kết quả:** 9 test Agent đạt; 1 test ngân sách đạt. MySQL trả áo sơ mi trắng `p003` giá 339.000đ; size hiển thị theo dữ liệu tổng của sản phẩm; outfit đi làm `p027` + `p005` tổng 898.000đ; thay áo bằng `p003` giữ quần `p005`, tổng 888.000đ. Chi tiết sản phẩm cũng khớp giá/tồn kho DB.
- **Còn tồn tại:** Các smoke này gọi handler trực tiếp, không phải Gemini live; Gemini 504 ngăn xác nhận quy trình model tự chọn và gọi tool.
- **Tiếp theo:** Lặp lại kịch bản thông qua chatbot sau khi Gemini hoạt động.

## PHASE 5 — Kiểm thử

- **File đã kiểm tra:** Backend, frontend, routes health/stores/products/media.
- **Lệnh/kiểm tra:** Nhóm backend test mục tiêu; `npm --prefix backend run build`; `npm --prefix frontend run build`; `npm --prefix frontend run lint`; chạy backend/frontend production và gọi HTTP.
- **Kết quả:** Tổng 44 test backend đạt (9 Agent + 2 reservation + 1 ngân sách + 32 test khác); Prisma Client generate đạt; frontend build đạt 35 trang; lint 0 lỗi, 76 cảnh báo. Health 200/DB connected; stores 200; admin không token 401; frontend `/` và `/admin/products/new` 200.
- **Còn tồn tại:** Ảnh media mẫu trả 404; Gemini live 504; không chạy thao tác admin ghi DB.
- **Tiếp theo:** Khắc phục nguồn/ánh xạ media có bằng chứng; xác nhận Gemini và kiểm thử admin bằng tài khoản được cấp.

## PHASE 6 — Báo cáo

- **File đã tạo/cập nhật:** `docs/PROGRESS_LOG.md`, `docs/FINAL_PROJECT_REPORT.md`, `docs/DEMO_SCRIPT.md`, phụ lục cập nhật trong `docs/PHASE_00_PROJECT_AUDIT.md`.
- **Kết quả:** Báo cáo phân biệt rõ kiểm thử mock, smoke trên MySQL thật và blocker chưa đạt; không đánh dấu PASS cho Gemini live hoặc luồng admin ghi dữ liệu.
