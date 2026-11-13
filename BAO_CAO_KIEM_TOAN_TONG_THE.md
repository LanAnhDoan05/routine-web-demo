# Báo cáo kiểm toán tổng thể Routine

**Ngày:** 2026-11-08  
**Phạm vi:** Đọc và chỉnh sửa source trong workspace. Theo phê duyệt rõ của người dùng, chỉ bổ sung migration hội thoại gồm hai bảng trên Aiven; không ghi dữ liệu sản phẩm/đơn hàng/khách hàng, không push GitHub hoặc deploy ứng dụng.

## 1. Kiến trúc ghi nhận

- Frontend: Next.js 16, React 19; gọi Backend qua `/api/v1`.
- Backend: Node.js, Express, Prisma.
- Database: MySQL; cấu hình lấy từ `.env` cục bộ, không ghi lại hoặc hiển thị giá trị bí mật.
- AI: Google Gemini; luồng Stylist lấy dữ liệu sản phẩm qua Backend trước khi tạo phản hồi.
- Media: dữ liệu ảnh được lưu qua model `MediaFile` trong MySQL; URL trả về qua API media.

## 2. Kết quả kiểm tra

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
|---|---|---|
| Đọc và xác thực cấu hình | PASS | Prisma xác thực schema thành công; không sửa `.env` và không in giá trị bí mật. |
| Kết nối MySQL | PASS | Health check và truy vấn chỉ đọc xác nhận DB kết nối, có 34 sản phẩm. |
| Kết nối Gemini | PASS | `POST /api/v1/ai/stylist` trả HTTP 200, `aiStatus=gemini`, 3 sản phẩm từ catalog; Gemini từng tạm trả 503 ở một lần gọi trước. |
| Prisma schema | PASS | `npx prisma validate` thành công; Prisma Client được generate thành công. |
| Migration hội thoại | PASS | Theo phê duyệt, chỉ chạy `20261108000000_ai_conversations_leads`; xác minh hai bảng có mặt và ghi nhận migration. Không chạy các migration pending khác. |
| Các migration còn lại | BLOCKED | Prisma đang báo các migration cũ về stock reservation/product variants và migration media chưa được ghi nhận; không chạy `migrate deploy` vì có thể xung đột với bảng đã tồn tại. |
| Grounding sản phẩm / RAG | PASS | API Stylist thật đã truy xuất 3 sản phẩm từ catalog. Kiểm tra truy vấn “áo thu đông màu nâu” ở chế độ chỉ đọc trả 1 Wool Blend Coat màu camel (khớp nâu) và phản hồi Gemini. Chưa kiểm thử đầy đủ các truy vấn/biến thể/RAG. |
| Product CRUD | NOT TESTED | Không thực hiện tạo/sửa/xóa sản phẩm thật để tránh ghi dữ liệu dịch vụ. |
| Purchase Intent | PASS | 4 kiểm thử xác nhận chỉ tính tin khách, giới hạn điểm thành phần, phân loại các ngưỡng và xử lý hội thoại trống. |
| Conversation / handoff / staff messaging | NOT TESTED | Hai bảng hội thoại đã được thêm; endpoint đọc hội thoại truy vấn được schema mới. Chưa gửi tin nhắn test hoặc tạo lead trên DB để tránh ghi dữ liệu ngoài yêu cầu. |
| API và kiểm thử tự động | PASS | 20 kiểm thử unit/validation liên quan AI grounding, giỏ hàng, Purchase Intent và request validation thành công. Truy vấn AI trực tiếp chỉ đọc database cũng đã chạy; không tạo tin nhắn/hội thoại trong lượt xác minh này. |
| Frontend production build | PASS | `npm run build` thành công; route `/admin/leads` được Next.js nhận diện. |
| Backend build | PASS | `npm run build` generate Prisma Client thành công. |
| Frontend lint | PASS | `npm run lint` exit 0, không có lỗi; có 76 cảnh báo hiện có trên toàn frontend. Lint tập trung các file sửa có 0 lỗi và 2 cảnh báo `<img>` trong AI chat. |
| Bảo vệ API admin | PASS | Gọi `/api/v1/ai/admin/leads` không token trả 401. Chưa kiểm thử với tài khoản ADMIN/CUSTOMER đã đăng nhập. |
| Bảo mật toàn hệ thống | FAIL | Phát hiện script SQL công khai ghi mật khẩu admin demo dạng văn bản rõ và hash cố định tại `backend/scripts/build_full_sql.js`; không tái sử dụng credential demo. Chưa kiểm thử xâm nhập. |
| Responsive / visual | NOT TESTED | Có CSS responsive cho màn hình lead; chưa chạy kiểm thử trình duyệt trực quan. |
| E2E toàn hành trình | NOT TESTED | Chưa tạo chat/lead/order test trên DB. Trang AI Stylist đã chạy và sẵn sàng để người dùng thử. |

## 3. Thay đổi chính

- AI Stylist chỉ dùng sản phẩm đang kinh doanh, có tồn kho, giá và biến thể hợp lệ; bỏ dữ liệu sản phẩm/size/màu/ảnh fallback giả.
- Giỏ hàng xác minh sản phẩm, variant, giá và tồn kho từ database; từ chối số lượng vượt tồn kho variant.
- Media được lưu và đọc qua `MediaFile`; ảnh không tìm thấy không còn trả placeholder thành công.
- Hội thoại lưu theo user hoặc guest session; context gần đây lấy từ database, không tin lịch sử client gửi lên.
- Thêm chấm điểm Purchase Intent từ tin khách hàng, lưu tín hiệu và sản phẩm quan tâm.
- Handoff chỉ được tạo sau thao tác đồng ý của khách; thêm API và giao diện admin xem lead, lịch sử, gửi tin và đổi trạng thái.
- Giới hạn ảnh chat đồng nhất ở 4 MB, phù hợp giới hạn lưu media.
- Câu hỏi về một sản phẩm cụ thể được ưu tiên trả một thẻ sản phẩm khớp intent thay vì tự ghép outfit không liên quan; đối chiếu màu Việt - Anh như nâu/Brown/Camel.
- AI được hướng dẫn không lặp lại tên/giá/màu/size/tồn kho trong phần văn bản; các dữ kiện mua sắm hiển thị bằng thẻ có dữ liệu từ backend. Định dạng `**đậm**` và danh sách gạch đầu dòng trong chat được render đúng.

## 4. File được thêm hoặc sửa

- Backend: `backend/src/services/aiService.js`, `backend/src/services/cartService.js`, `backend/src/services/mediaService.js`, `backend/src/utils/fileStorage.js`, `backend/src/controllers/aiController.js`, `backend/src/controllers/mediaController.js`, `backend/src/routes/aiRoutes.js`.
- Backend liên quan media: `backend/src/services/categoryService.js`, `outfitService.js`, `productService.js`, `reviewService.js`, `styleService.js`.
- Hội thoại và ý định mua: `backend/src/services/conversationService.js`, `backend/src/services/purchaseIntentService.js`, `backend/src/controllers/conversationController.js`, `backend/prisma/schema.prisma`.
- Migration: `backend/prisma/migrations/20261108000000_ai_conversations_leads/migration.sql`, `backend/prisma/migrations/20261108000100_media_files/migration.sql`.
- Kiểm thử: `backend/tests/test_ai_product_grounding.js`, `test_cart_database_grounding.js`, `test_purchase_intent.js`; cập nhật script và kiểm thử validation trong `backend/package.json` và `backend/tests/test_ai_request_validation.js`.
- Frontend chat/giỏ hàng: `frontend/components/ai/AIStylistChat.jsx`, `InteractiveOutfitCard.jsx`, `frontend/context/CartContext.jsx`, `frontend/lib/aiStylistService.js`.
- Admin lead: `frontend/app/admin/leads/page.jsx`, `page.module.css`, `frontend/lib/adminNav.js`.

## 5. Rủi ro và việc cần làm trước khi nghiệm thu

1. Áp các migration sau khi có quy trình phê duyệt và backup phù hợp; sau đó kiểm thử với môi trường staging trước production.
2. Chạy API integration và E2E bằng dữ liệu kiểm thử được phê duyệt; xác minh ảnh, hội thoại, lead và tin staff tồn tại sau reload.
3. Hoàn tất kiểm tra giao diện responsive và kiểm thử phân quyền ADMIN/CUSTOMER/guest trên trình duyệt.
4. Các thông tin xác thực từng xuất hiện trong nội dung hội thoại trước đó nên được chủ dịch vụ luân chuyển. Báo cáo này không lưu hoặc lặp lại giá trị.

**Lưu ý:** Các thay đổi source vẫn nằm trong workspace local. Migration hai bảng hội thoại được áp dụng theo phê duyệt; không có migration nào khác, push GitHub hoặc deployment ứng dụng.
