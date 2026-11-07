# Audit hệ thống FE / BE / Database / AI

Ngày audit/triển khai: 2026-10-29. Sau audit ban đầu đã triển khai phần catalog sản phẩm trên source hiện tại. Không chạy migration hoặc tạo/cập nhật/xóa dữ liệu trong database; các CRUD E2E vẫn chờ DB test/cấu hình thật.

## 1. Tổng quan trạng thái

| Thành phần | Trạng thái | Bằng chứng / giới hạn |
|---|---|---|
| Frontend | PARTIAL | Next dev/build hoạt động; dynamic params đã sửa; homepage có Featured/New Arrivals và responsive. Catalog rỗng vì DB thiếu. |
| Backend | PARTIAL | Express lắng nghe port 5001; product CRUD/admin routes và config routes có auth; health phản ánh DB unavailable. Catalog public cần DB. |
| Database | BLOCKED | Prisma dùng MySQL; không có `backend/.env`/`DATABASE_URL`. Không kết nối, không xác minh Aiven `defaultdb`, không chạy CRUD. |
| Gemini API | BLOCKED | SDK chính thức import được và model cấu hình là `gemini-3.8-flash`; không có `GEMINI_API_KEY`, nên không gửi request Google thật. |
| AI Agent | PARTIAL | Luồng greeting qua FE → BE → local fallback → FE đã hoạt động; retrieval sản phẩm/size cần DB và lời gọi Gemini thật chưa kiểm thử. |
| End-to-End | PARTIAL | FE→BE greeting fallback PASS. FE→BE→DB và FE→BE→Gemini→FE BLOCKED do thiếu cấu hình. |

## 2. Kết quả kiểm thử và bằng chứng

| Kiểm tra | Trạng thái | Kết quả thực tế |
|---|---|---|
| `npm run dev` từ root | PASS | Backend `http://localhost:5001` và Next `http://localhost:3000` cùng khởi động. Server đã dừng sau audit. |
| GET `/` | PASS | HTTP 200; trang chủ render. |
| Responsive homepage / AI page | PASS | Kiểm tra viewport 390, 768, 1440 px; document width lần lượt 375, 753, 1425 px, không tràn ngang. |
| GET `/api/v1/health` | PARTIAL | HTTP 503, `success:false`, `status:unhealthy`, `dbStatus:error`; nguyên nhân là không có `DATABASE_URL`. |
| GET `/api/v1/products?limit=1` | PARTIAL | HTTP 200 nhưng danh sách rỗng; service bắt lỗi Prisma và trả `[]`, không chứng minh dữ liệu DB. |
| GET `/api/v1/categories` | PARTIAL | HTTP 200; service có thể trả cấu trúc mặc định/rỗng khi DB lỗi. Không xác nhận dữ liệu thật. |
| GET `/api/v1/styles` | PARTIAL | HTTP 200; không xác nhận bản ghi MySQL. |
| GET `/api/v1/outfits?limit=1` | FAIL | HTTP 500, Prisma không thể resolve `DATABASE_URL`. |
| GET `/api/v1/orders?limit=1` | FAIL | HTTP 500, Prisma không thể resolve `DATABASE_URL`; browser log lặp lỗi này từ OrderContext. |
| POST `/api/v1/ai/chat` với message rỗng | PASS | HTTP 400, JSON `success:false` và message validation. |
| POST `/api/v1/auth/register` với body `{}` | PASS | HTTP 400, lỗi validation tên không hợp lệ; không tạo user. |
| GET `/api/v1/coupons/admin/all` không token | PASS | HTTP 401, yêu cầu Bearer token. |
| POST `/api/v1/products` không token | PASS | HTTP 401; không tạo sản phẩm. |
| GET `/api/v1/not-a-route` | PASS | HTTP 404 JSON. |
| AI Stylist UI gửi “xin chào” | PASS (fallback) | UI hiển thị câu trả lời local; không chứng minh Gemini. Browser cũng ghi lỗi 500 orders từ context chung. |
| Gemini không có key | PASS (fallback only) | `geminiService.generateContent()` trả `null`; không gọi Google. |
| Gemini request thật | BLOCKED | Không có key; chưa kiểm tra auth, quota, timeout hoặc model response. |
| `npm run build` | PASS | Sau khi dừng Node watcher để giải phóng Prisma DLL, Prisma Client generate và Next build thành công, 34 routes. Lần đầu bị `EPERM` do DLL đang được server dùng. |
| `npm run lint` | PARTIAL | Exit 0, 0 errors, 77 warnings về React Hooks/memoization/`<img>`. |
| `npm run test:ai-validation` | PASS | 5/5 test pass; không truy cập DB hoặc Gemini. |
| `npm run test:product-validation` | PASS | 9/9 case validation pass trước khi truy cập Prisma. |
| ProductCard settings/page | PARTIAL | Code/build pass; HTTP GET trả default config. PUT chưa test lưu vì cần Admin token và DB. |
| Admin product APIs | PARTIAL | Không token: admin list, SKU check, upload đều HTTP 401. CRUD có token chưa test. |
| Homepage product sections | PARTIAL | Browser HTTP 200 ở 390/768/1440 px; Featured/New Arrivals render và không tràn ngang; dữ liệu trống do DB. |
| Frontend `npm audit --omit=dev` | PASS | 0 vulnerabilities. |
| Backend `npm audit` | FAIL (security finding) | 3 high severity gắn với Prisma 6 toolchain; npm đề xuất Prisma 7 major. Chưa nâng major trong audit này. |

## 3. Lỗi và rủi ro phát hiện

### High: thiếu cấu hình kết nối MySQL

- File liên quan: `backend/prisma/schema.prisma`, `backend/.env.example`.
- Nguyên nhân: workspace không có `backend/.env`; Prisma báo `Environment variable not found: DATABASE_URL`.
- Ảnh hưởng: outfits/orders và các nghiệp vụ cần dữ liệu thật không hoạt động; products/categories/styles có fallback trả HTTP 200 nhưng rỗng/mặc định.
- Hướng xử lý: sau khi được cho phép, điền connection string Aiven/local trong `.env`, kiểm tra health và schema. Không chạy migration/`db push` trên DB đang có dữ liệu trước khi so sánh.

### Đã xử lý: dynamic routes Next.js 16

- Files liên quan: `frontend/app/smart-outfit/ai-stylist/page.js`, `frontend/app/category/[slug]/page.js`, `frontend/app/product/[id]/page.js`, `frontend/app/admin/products/[id]/edit/page.jsx`.
- Đã sửa: server pages/metadata dùng `await params/searchParams`; client Admin edit dùng `useParams`.
- Bằng chứng: build pass và các route category/product/AI Stylist trả HTTP 200, response không còn báo `params is a Promise`.

### High: Gemini chưa được xác minh bằng API thật

- File liên quan: `backend/src/services/geminiService.js`, `backend/.env.example`.
- Nguyên nhân: không có `GEMINI_API_KEY` trong môi trường; audit chỉ xác nhận SDK import và fallback.
- Ảnh hưởng: không thể xác nhận key, quota, model access, timeout, response format hay AI Agent đầy đủ.
- Hướng xử lý: cấu hình key cục bộ từ Google AI Studio, gửi prompt kiểm thử an toàn và xác minh output/timeout; không đưa key vào báo cáo/chat.

### High: CRUD đã có implementation nhưng chưa kiểm thử với DB

- File liên quan: các `backend/src/routes/*`, controllers/services; schema `backend/prisma/schema.prisma`.
- Đã triển khai: Admin list/detail riêng có auth; create/update ghi status và product variants; delete chuyển sang `INACTIVE` để giữ lịch sử; public queries lọc `ACTIVE`; form dùng backend làm nguồn dữ liệu duy nhất.
- Nguyên nhân chưa E2E: không có DB URL/database test; Aiven `defaultdb` chưa được đối chiếu schema.
- Hướng xử lý: sau khi cấu hình DB test và áp dụng migration có kiểm soát, thử create/list/update/hide/reload với sản phẩm kiểm thử riêng.

### Medium: lỗi DB bị chuyển thành fallback rỗng cho một số API

- File liên quan: `backend/src/services/productService.js`, `backend/src/services/categoryService.js`, `backend/src/services/styleService.js`.
- Bằng chứng: products/categories/styles có thể trả HTTP 200 với mảng/dữ liệu rỗng sau khi bắt lỗi Prisma; client khó phân biệt “không có dữ liệu” với “DB mất kết nối”.
- Hướng xử lý: phân biệt lỗi upstream/database với trạng thái empty; trả lỗi 503 nhất quán khi DB unavailable.

### Medium: lỗi toàn cục từ OrderContext ảnh hưởng nhiều trang

- File liên quan: `frontend/context/OrderContext.jsx`, `frontend/lib/orderService.js`.
- Bằng chứng: trang chủ và AI page phát sinh browser console 500 vì provider tự tải `/api/v1/orders?limit=50` dù không có DB config.
- Hướng xử lý: kiểm tra readiness trước khi tải hoặc hiện trạng thái lỗi rõ ràng, tránh console exception lặp trên trang không dùng orders.

### Medium: warnings React Hooks và dependency

- File liên quan: nhiều trang/context, báo cáo lint hiện 77 warnings.
- Ảnh hưởng: không làm lint fail nhưng có khả năng stale state, dependency thiếu hoặc render thừa; chưa review từng warning theo behavior.
- Hướng xử lý: xử lý theo từng module/test, không tắt thêm rule toàn cục.

### Medium: Prisma toolchain có 3 advisory High

- File liên quan: `backend/package.json`/lockfile, dependency Prisma 6.
- Nguyên nhân: npm audit chỉ đề xuất bản sửa khi nâng Prisma 7 major.
- Hướng xử lý: lên kế hoạch riêng cho migration Prisma 7; trước đó đánh giá advisory exposure của CLI và kiểm thử schema trên DB test.

## 4. API đã kiểm tra và chưa kiểm tra

Đã gửi request thực tế cho health, products, categories, styles, outfits, orders, AI chat validation, auth register validation, admin coupons auth, product create auth và route không tồn tại. Kết quả chi tiết ở bảng trên.

Route inventory có các nhóm auth, users/addresses, products, categories/styles, outfits, cart, wishlist, orders, reviews, coupons, payments, analytics, media/upload, stores, shipping, settings và AI/search. Các endpoint chưa có bằng chứng request/response được đánh dấu **NOT TESTED**; đặc biệt các request ghi dữ liệu, thanh toán, email, rate-limit và quyền admin hợp lệ chưa chạy.

## 5. Database và Gemini: kết luận

- Database: code dùng MySQL + Prisma. Ảnh Workbench cho thấy schema tên `defaultdb` và bảng `addresses`, nhưng không chứng minh backend kết nối được. Dự án hiện chưa có `DATABASE_URL`; chưa biết toàn bộ schema Aiven có tương thích hay không. CRUD thực tế: **NOT TESTED/BLOCKED**.
- Gemini: `@google/genai` SDK v2.32.0 đã cài; service cấu hình model mặc định `gemini-3.8-flash`, timeout và fallback. Key không có; Gemini API thật: **NOT TESTED/BLOCKED**.
- AI Agent: greeting fallback qua browser hoạt động; tư vấn dựa trên sản phẩm DB/Gemini chưa hoàn chỉnh hoặc chưa thể xác minh. Trạng thái: **PARTIAL**.

## 6. Ưu tiên xử lý

1. **High**: cấu hình DB test/Aiven an toàn; kiểm tra schema thực, xác nhận `products.status` và `product_variants`; migration chưa chạy.
2. **High**: chạy CRUD E2E với token Admin trên DB test riêng và kiểm tra public refresh sau create/update/hide.
3. **High**: kiểm tra settings save UI và upload ảnh với Admin token/DB đã cấu hình.
4. **High**: cấu hình Gemini key cục bộ và kiểm thử request AI thật nếu yêu cầu agent end-to-end.
5. **Medium**: review 77 lint warnings, Prisma audit và lỗi toàn cục OrderContext khi DB không sẵn sàng.

## 7. Trả lời 4 câu hỏi

1. **Frontend hoạt động bình thường chưa?** Một phần: build/routes/responsive pass; sản phẩm không tải được vì DB thiếu.
2. **Backend hoạt động bình thường chưa?** Một phần: server/routes/auth/validation pass; public catalog phụ thuộc DB và hiện trả 500.
3. **Backend đã kết nối và thao tác DB thật chưa?** Chưa. Chỉ có cấu hình/schema trong code và ảnh Workbench; không có bằng chứng kết nối hoặc CRUD backend.
4. **AI Agent hoàn chỉnh chưa?** Chưa. Local greeting fallback hoạt động; chưa gọi Gemini thật hoặc xác minh retrieval từ DB.

**Đủ điều kiện chạy local ổn định?** FE/BE khởi động và build được; chưa đủ cho nghiệp vụ catalog/Admin thực tế trước khi cấu hình DB và chạy CRUD E2E.

## 8. Bảo mật và dữ liệu

Không có key/mật khẩu nào được đưa vào báo cáo. Không chạy migration hoặc thử CRUD ghi/xóa trong DB. Migration product variants/status chỉ được tạo, chưa áp dụng. Vì thiếu DB credentials, không tuyên bố CRUD E2E hoàn tất.

## 9. Files đã thay đổi trong implementation

- Backend: `backend/prisma/schema.prisma`, migration `backend/prisma/migrations/20261029000000_product_variants/migration.sql`, `backend/src/services/productService.js`, `backend/src/controllers/productController.js`, `backend/src/routes/productRoutes.js`, `backend/src/routes/uploadRoutes.js`, `backend/src/services/settingService.js`, `backend/src/controllers/settingController.js`, `backend/src/routes/settingRoutes.js`.
- Frontend: `frontend/lib/adminProductService.js`, `frontend/lib/api.js`, `frontend/app/page.js`, `frontend/components/product/ProductCard.jsx`, `frontend/components/product/ProductGrid.jsx`, `frontend/components/product/ProductCard.module.css`, `frontend/context/ProductCardSettingsContext.jsx`, `frontend/app/layout.js`, `frontend/app/globals.css`, `frontend/app/admin/settings/page.jsx`, `frontend/app/admin/settings/page.module.css`, `frontend/app/admin/products/page.jsx`, `frontend/components/admin/ProductForm.jsx`.
- Tests/build: `backend/tests/test_product_validation.js`, `backend/package.json`.
- Runtime compatibility fixed: `frontend/app/smart-outfit/ai-stylist/page.js`, `frontend/app/category/[slug]/page.js`, `frontend/app/product/[id]/page.js`, `frontend/app/admin/products/[id]/edit/page.jsx`.