# BÁO CÁO KIỂM TOÁN DỰ ÁN ROUTINE WEB + GEMINI AI
**Mã tài liệu:** `docs/PHASE_00_PROJECT_AUDIT.md`
**Giai đoạn:** GIAI ĐOẠN 0 – KIỂM TRA VÀ ĐÁNH GIÁ TOÀN BỘ DỰ ÁN
**Kỹ sư thực hiện:** Senior Full-stack Developer, AI Engineer & Software Tester
**Ngày thực hiện:** 14/11/2026
**Trạng thái bàn giao:** **PARTIAL** (Đã phát hiện đầy đủ nguyên nhân và danh sách lỗi, sẵn sàng kế hoạch cho Giai đoạn 1)

> **Cập nhật sau kiểm chứng triển khai:** Báo cáo kiểm toán bên dưới là ảnh chụp lịch sử, một số số liệu và nhận định đã lỗi thời. Health API hiện kết nối MySQL và báo 37 sản phẩm; API cửa hàng trả HTTP 200, bảng `stores` có 25 bản ghi, và kiểm tra chỉ đọc trước đó ghi nhận 5 migration đã hoàn tất. Không chạy migration hoặc ghi dữ liệu trong phiên này. Kiểm tra Gemini trực tiếp vẫn gặp HTTP 504 nên chưa xác nhận được function call thật từ mô hình. Một ảnh của sản phẩm `p003` đang trỏ tới file không tồn tại ở backend/frontend uploads và media proxy trả 404; 906 ảnh nguồn không có dấu hiệu tên thư mục/tệp đủ để gán an toàn, do đó không tự ý liên kết ảnh.

---

## 1. CẤU TRÚC HỆ THỐNG HIỆN TẠI

### 1.1. Công nghệ & Nền tảng
- **Repository:** `https://github.com/LanAnhDoan05/routine-web-demo.git`
- **Frontend:**
  - Next.js 16.4.3 (Turbopack, App Router)
  - React 19.2.3, React DOM 19.2.3
  - ESLint 9.39.5, `eslint-config-next` 16.4.3
  - Quản lý CSS Module, CSS Variables giao diện Routine
- **Backend:**
  - Node.js (Runtime v24.20.0), Express.js 4.22.3
  - Prisma ORM 6.19.3
  - Authentication: JWT (`jsonwebtoken` 9.0.3) + `bcryptjs` 3.0.3
  - Bảo mật & Giới hạn: `helmet` 8.3.0, `cors` 2.8.6, `express-rate-limit` 8.7.0
  - Thanh toán: `vnpay` 2.5.0 (Sandbox SHA512)
  - Xử lý file/media: `multer` 2.3.0 (Memory Storage) + Database LONGBLOB
  - Email: `nodemailer` 10.0.1 (SMTP)
- **Database:**
  - MySQL trên hạ tầng Cloud Aiven (kết nối qua cấu hình môi trường; endpoint và thông tin xác thực không ghi trong báo cáo)
  - 24 bảng dữ liệu thực tế đang hoạt động
- **AI & LLM:**
  - SDK: `@google/genai` v2.32.0 (Google GenAI Official SDK)
  - Model cấu hình: `DEFAULT_MODEL = 'gemini-3.8-flash'`, `FALLBACK_MODEL = 'gemini-3.5-flash'`
  - Phân tích từ ngữ: Bộ từ điển `fashionThesaurus.js` + RAG Vector Engine nội bộ

---

## 2. CÁC CHỨC NĂNG ĐÃ HOÀN THÀNH

### 2.1. Backend & Dữ liệu
1. **Health Check API (`GET /api/v1/health`):** Kiểm tra trạng thái runtime của Express và MySQL, trả về `healthy`, `dbStatus: connected`, đếm đúng 38 sản phẩm đang có.
2. **Hệ thống xác thực (Authentication & Authorization):**
   - Đăng ký, Đăng nhập cấp phát JWT.
   - Phân quyền nghiêm ngặt theo Role: `CUSTOMER` và `ADMIN`.
   - Bảo vệ route nhạy cảm (các endpoint `/admin/*`, `POST/PUT/DELETE /products`, `outfits`, `categories` đều chặn truy cập không phép 401 hoặc sai role 403).
3. **Quản lý danh mục & Bộ sưu tập:**
   - 26 danh mục trong MySQL (`categories`).
   - 6 phong cách thời trang (`styles`).
   - 9 bộ trang phục phối sẵn (`outfits`) liên kết 20 sản phẩm qua bảng `outfit_products`.
4. **Giỏ hàng & Đơn hàng:**
   - Phân biệt giỏ hàng Khách vãng lai (`guest_session_id`) và Khách đã đăng nhập (`user_id`).
   - Kiểm tra tồn kho và biến thể trước khi thêm vào giỏ.
   - Áp dụng và hủy mã giảm giá (`coupons`).
   - 53 đơn hàng thực tế và 89 dòng sản phẩm (`order_items`) trong database.
5. **Cổng thanh toán điện tử VNPay:**
   - Tạo URL thanh toán VNPay Sandbox với mã băm SHA512.
   - Xác thực Return URL và IPN webhook bảo mật, phát hiện chữ ký giả mạo.
6. **Lưu trữ & Phục vụ Media đa tầng (`MediaFile`):**
   - 96 file media được lưu trực tiếp dạng nhị phân trong bảng `media_files` (MySQL LONGBLOB).
   - Cơ chế phục vụ qua `mediaController.serveMedia`: File đĩa cứng -> MySQL LongBlob -> HTTP 304/Etag caching.

### 2.2. Frontend
1. **Build Production thành công 100%:**
   - `next build` hoàn tất không có lỗi, tạo thành công 35 trang tĩnh và động.
2. **Giao diện Khách hàng hoàn chỉnh:**
   - Trang chủ (`/`), Danh mục (`/category/[slug]`), Chi tiết sản phẩm (`/product/[id]`).
   - Giỏ hàng (`/cart`), Thanh toán (`/checkout`), Kết quả VNPay (`/checkout/payment/vnpay-return`).
   - Đăng nhập, Đăng ký, Quản lý tài khoản, Đơn hàng của tôi.
   - Smart Outfit & AI Stylist Chat (`/smart-outfit/ai-stylist`).
3. **Giao diện Quản trị Admin đa chức năng:**
   - Quản trị sản phẩm (`/admin/products`), thêm mới (`/admin/products/new`), sửa (`/admin/products/[id]/edit`).
   - Quản trị danh mục, đơn hàng, khách hàng, banner, khuyến mãi, lead khách hàng tiềm năng (`/admin/leads`).

---

## 3. CÁC CHỨC NĂNG ĐANG HOẠT ĐỘNG MỘT PHẦN

1. **AI Stylist Chatbot:**
   - *Điểm hoạt động:* Chào hỏi tự nhiên không bị tự ý phối đồ; chấm điểm Purchase Intent từ tin nhắn khách; trích xuất nhu cầu theo form dáng, màu sắc; lưu lịch sử hội thoại vào `ai_conversations` và `ai_conversation_messages`.
   - *Hạn chế:*
     - Chưa phải là AI Agent có cơ chế **Function Calling (Tool Calling)** tự chủ; hiện tại đang hoạt động theo luồng Chatbot kịch bản kết hợp LLM sinh text.
     - Phân loại ý định còn cứng nhắc: khi người dùng hỏi "Tìm cho mình một chiếc áo sơ mi trắng", hệ thống gán `isAskingForOutfit: true` và `requestType: "new_outfit"`, cố gắng đi tìm quần để ghép bộ thay vì chỉ tư vấn đúng chiếc áo sơ mi theo yêu cầu.
     - Model `gemini-3.8-flash` đang bị quá tải (HTTP 503), phải chờ 15s timeout mới fallback sang `gemini-3.5-flash`, làm thời gian phản hồi bị chậm.
2. **Quản lý biến thể sản phẩm (`ProductVariant`):**
   - Đã có bảng `product_variants` trong MySQL và model trong Prisma, nhưng hiện chỉ có **1 bản ghi**, trong khi có 38 sản phẩm. Hầu hết sản phẩm đang dùng trường JSON thô (`sizes`, `colors`) trên bảng `products`.
3. **Đồng bộ ảnh Uploads:**
   - 96 ảnh tồn tại trong bảng `media_files` và phục vụ tốt qua `/api/v1/media/:id`.
   - Thư mục vật lý `backend/public/uploads` có 164 file nhưng `frontend/public/uploads` có 149 file (lệch 15 file). Bộ ảnh nguồn mới tại `C:\Ảnh routine` (176 thư mục, 903 ảnh) chưa được gán và thay thế cho toàn bộ 38 sản phẩm.

---

## 4. CÁC CHỨC NĂNG CHƯA HOẠT ĐỘNG / BỊ LỖI

1. **Hệ thống Cửa hàng (`stores`):**
   - Bảng `stores` **chưa tồn tại trong CSDL MySQL**, gây lỗi **HTTP 500** ngay lập tức khi người dùng hoặc Admin truy cập API `/api/v1/stores` hoặc trang `/admin/stores`.
2. **Cơ chế AI Agent tự hành (Autonomous Tool Calling):**
   - Chưa có 6 công cụ chuẩn (`search_products`, `get_product_details`, `recommend_outfit`, `replace_outfit_item`, `get_available_sizes`, `get_recommendation_explanation`).
3. **Đồng bộ Prisma Migration History:**
   - Trong bảng `_prisma_migrations`, chỉ có 1 migration được ghi nhận, trong khi có 3 migration khác trên code chưa được đánh dấu (`add_stock_reservations`, `product_variants`, `media_files`). Chạy lệnh `prisma migrate deploy` thông thường sẽ báo lỗi bảng đã tồn tại.

---

## 5. DANH SÁCH LỖI THEO MỨC ĐỘ NGHIÊM TRỌNG

| Mức độ | Mã lỗi | Vị trí phát hiện | Mô tả lỗi |
|---|---|---|---|
| **CRITICAL** | `ERR-DB-001` | `backend/src/services/storeService.js` | Bảng `stores` không tồn tại trong MySQL. Gọi `GET /api/v1/stores` hoặc vào Admin Stores gây crash 500. |
| **CRITICAL** | `ERR-AI-001` | `backend/src/services/geminiService.js` | `DEFAULT_MODEL` đặt là `gemini-3.8-flash` liên tục bị HTTP 503 (High Demand). Gây delay 15-30 giây mỗi lượt chat trước khi fallback sang `gemini-3.5-flash`. |
| **HIGH** | `ERR-DB-002` | `backend/prisma/migrations` | Migration drift: 3 migration chưa được đánh dấu trong `_prisma_migrations`, có nguy cơ lỗi xung đột khi chạy deployment. |
| **HIGH** | `ERR-PRD-001` | `backend/src/services/productService.js` | Hàm `createProduct` không bắt lỗi ảnh rỗng (`images: []`), tự fallback sang file SVG placeholder thay vì từ chối HTTP 400. Làm test `test_product_validation.js` fail và ghi rác vào DB. |
| **HIGH** | `ERR-AI-002` | `backend/src/services/aiService.js` | Vi phạm quy tắc tư vấn: Khi khách hỏi một sản phẩm cụ thể ("Tìm cho mình một chiếc áo sơ mi trắng"), hệ thống tự động gán `isAskingForOutfit: true` và cố gắng phối đồ thay vì chỉ hiển thị sản phẩm tương ứng. |
| **HIGH** | `ERR-AGT-001` | `backend/src/services/aiService.js` | Chưa có cấu trúc AI Agent thực thụ (Tool Calling / Function Calling). AI chỉ hoạt động như một bộ lọc văn bản kết hợp sinh lời thoại. |
| **MEDIUM** | `ERR-TST-001` | `backend/tests/test_order_invoice_email.js` | Test tự động lấy sản phẩm đầu tiên trong DB (`p-4e04fa24...`) có tồn kho = 0, khiến test tạo đơn hàng báo lỗi 400 Out of Stock. |
| **MEDIUM** | `ERR-TST-002` | `backend/tests/test_products_api.js` | Assertion test hardcode số lượng sản phẩm là 28 (`total === 28`), trong khi DB đã tăng lên 38 sản phẩm, làm test báo Fail sai. |
| **MEDIUM** | `ERR-TST-003` | `backend/tests/test_cart_wishlist_api.js` | Test merge giỏ hàng gửi thiếu `size` và `color` cho sản phẩm `p004`, bị backend chặn 400 đúng luật nhưng test lại coi là thất bại. |
| **LOW** | `ERR-LNT-001` | `frontend/components/*`, `frontend/app/*` | 76 ESLint Warnings liên quan đến `react-hooks/set-state-in-effect` và `exhaustive-deps` trong các trang Admin. |

---

## 6. NGUYÊN NHÂN CỤ THỂ

1. **Về lỗi bảng `stores`:** File migration cho model `Store` chưa từng được chạy lên database Aiven MySQL, mặc dù đã có script `backend/scripts/setup_and_seed_stores.js` chuẩn bị sẵn.
2. **Về lỗi Gemini 503:** Endpoint Gemini API tại thời điểm hiện tại áp dụng hạn ngạch gắt gao với model thử nghiệm `gemini-3.8-flash`. Model `gemini-3.5-flash` phản hồi tức thì và ổn định nhưng hiện chỉ đang đóng vai trò fallback thứ cấp sau khi model chính bị timeout 15s.
3. **Về lỗi AI tự phối đồ:** Logic trong `aiService.js` tại `extractFashionIntent` và `isStandaloneProductRequest` chưa phân tách triệt để giữa ý định "xem sản phẩm đơn lẻ" và "yêu cầu phối bộ", khiến cờ `isAskingForOutfit` mặc định bị bật sang `true`.
4. **Về thiếu sót AI Agent:** Hệ thống ban đầu được thiết kế theo mô hình Chatbot RAG (trích xuất tham số từ text -> SQL filter -> prompt ghép lời văn), chưa đăng ký Tool Definition với Gemini SDK (`@google/genai`) để mô hình tự chủ gọi hàm.

---

## 7. GIẢI PHÁP ĐỀ XUẤT

1. **Khắc phục Database & Cửa hàng (Giai đoạn 1):**
   - Chạy script tạo bảng `stores` và nạp dữ liệu chuẩn 25 showroom Routine.
   - Sử dụng `prisma migrate resolve --applied` để đồng bộ lịch sử 3 migration còn thiếu mà không làm hỏng dữ liệu hiện tại.
   - Sửa `createProduct` trong `productService.js` để kiểm tra nghiêm ngặt: nếu `images` rỗng hoặc không có ảnh hợp lệ thì từ chối ngay với HTTP 400.
2. **Tối ưu hóa Gemini Model (Giai đoạn 3):**
   - Đặt `gemini-3.5-flash` làm model ưu tiên hoặc thiết lập cơ chế chuyển đổi thông minh không cần đợi timeout 15s khi model 3.8 báo 503.
   - Chuẩn hóa System Prompt để đảm bảo: **KHÔNG tự động phối đồ khi khách chỉ hỏi hoặc tìm một món đồ cụ thể**.
3. **Xây dựng AI Agent thực thụ (Giai đoạn 4):**
   - Khởi tạo Gemini Tools Declaration với 6 công cụ:
     1. `search_products(category, color, fit, priceMin, priceMax, gender, keyword)`
     2. `get_product_details(productId)`
     3. `recommend_outfit(style, occasion, budget, gender)`
     4. `replace_outfit_item(outfitId, replaceType, constraints)`
     5. `get_available_sizes(productId)`
     6. `get_recommendation_explanation(productIds, reason)`
   - Cung cấp cơ chế Agent Loop: User Message -> Intent & Task Planning -> Tool Selection -> Backend Tool Execution (MySQL Prisma) -> Context Update -> Final Response.
4. **Thay thế và liên kết bộ ảnh sản phẩm thật (Giai đoạn 2):**
   - Đối chiếu 38 sản phẩm DB với 176 thư mục ảnh thật tại `C:\Ảnh routine`.
   - Nạp ảnh vào `media_files` và `uploads`, cập nhật URL chuẩn cho từng sản phẩm.

---

## 8. KẾ HOẠCH TRIỂN KHAI CÁC GIAI ĐOẠN TIẾP THEO

- **Giai đoạn 1: Hoàn thiện Backend và MySQL**
  - Tạo bảng `stores`, giải quyết migration drift.
  - Sửa validation sản phẩm, cập nhật tồn kho các sản phẩm kiểm thử.
  - Đảm bảo 100% các bộ test tự động của Backend (`test_products_api`, `test_admin_api`, `test_cart_wishlist_api`, `test_order_invoice_email`) chạy Pass sạch sẽ.
- **Giai đoạn 2: Hoàn thiện Frontend và Admin**
  - Hoàn thiện chức năng quản trị sản phẩm, biến thể, giá, khuyến mãi, tồn kho.
  - Tiến hành batch upload và liên kết ảnh từ `C:\Ảnh routine` vào sản phẩm.
  - Kiểm tra đồng bộ dữ liệu thật giữa Admin và Giao diện người dùng.
- **Giai đoạn 3: Hoàn thiện Gemini AI Stylist**
  - Cấu hình model Gemini ổn định, xử lý triệt để lỗi 503 và giới hạn rate limit.
  - Cập nhật System Prompt và logic phân loại: Tuyệt đối không phối đồ khi khách chỉ tìm 1 món đồ.
  - Kiểm thử hội thoại đa lượt với dữ liệu tiếng Việt thực tế.
- **Giai đoạn 4: Xây dựng AI Agent**
  - Xây dựng 6 Tools tương tác CSDL MySQL qua Backend.
  - Triển khai Function Calling vòng lặp (Tool Calling Agent).
  - Kiểm thử 3 kịch bản demo bắt buộc theo Master Prompt.
- **Giai đoạn 5: Kiểm thử tổng thể và Bàn giao**
  - Đo lường KPI, lập bộ tài liệu kỹ thuật, hướng dẫn sử dụng và kịch bản demo trực tiếp.

---

## 9. NHỮNG THÔNG TIN CẦN CHỦ DỰ ÁN HỖ TRỢ

1. **Xác nhận về bảng `stores`:** Cho phép kích hoạt chạy script `backend/scripts/setup_and_seed_stores.js` để tạo bảng và nạp 25 cửa hàng Routine trong Giai đoạn 1.
2. **Quy tắc gán ảnh nguồn `C:\Ảnh routine`:** Trong thư mục `C:\Ảnh routine` có 176 nhóm sản phẩm với 903 ảnh, nhưng CSDL hiện có 38 sản phẩm. Xác nhận phương án: Ghép các sản phẩm hiện có theo đúng danh mục/giới tính tương ứng; các thư mục ảnh dư thừa sẽ được lưu trữ phân loại riêng và không tự ý tạo thêm sản phẩm rác vào DB nếu chưa yêu cầu.
3. **Phê duyệt chỉ thị bắt đầu Giai đoạn 1.**
