# Báo cáo cuối — Routine Web + Gemini AI Agent

## Trạng thái tổng quan

**Hoàn thành một phần; chưa sẵn sàng demo AI end-to-end.** Backend kết nối MySQL, frontend build và các công cụ đọc catalog hoạt động. Chưa xác nhận được Gemini live gọi công cụ do HTTP 504. Một đường dẫn ảnh sản phẩm thực tế đang 404, và chưa thử tạo/sửa sản phẩm vì cần xác thực admin, backup đầy đủ và ảnh có ánh xạ được xác nhận.

Repository: [routine-web-demo](https://github.com/LanAnhDoan05/routine-web-demo)
Commit nền đã có trên GitHub: `1c00ba61f3181ba9afcc03447d3c70e47973f005`.

## Công việc thực hiện

- Sửa tính `availableStock`: gom lượng hàng đang giữ theo batch và chờ truy vấn trước khi map sản phẩm, tránh trả Promise/giá trị không hợp lệ.
- Admin form không tự tạo giá trị size, màu, variant hoặc tồn kho không có căn cứ.
- Thêm Fashion Agent với sáu tool đọc catalog: `search_products`, `get_product_details`, `recommend_outfit`, `replace_outfit_item`, `get_available_sizes`, `get_recommendation_explanation`. Tool chạy qua service cố định; không có SQL tùy ý hoặc thao tác ghi DB do mô hình khởi tạo.
- Bổ sung ngữ cảnh product IDs để thay món; sửa tìm áo sơ mi trong nhóm category chung `ao`, tránh trả T-shirt cho truy vấn áo sơ mi, bỏ lọc giới tính quá hẹp khi thay món, và chọn cặp sản phẩm phù hợp ngân sách.
- Bổ sung test Agent, reservation và ngân sách outfit.

## Kết quả kiểm thử thực tế

| Hạng mục | Kết quả |
|---|---|
| Backend regression | 44/44 test đạt |
| Prisma Client | `npm --prefix backend run build` đạt |
| Frontend production build | Đạt; Next.js tạo 35 route |
| Frontend ESLint | 0 lỗi, 76 cảnh báo |
| MySQL health | HTTP 200, `dbStatus=connected`, 37 sản phẩm |
| Stores API | HTTP 200; kiểm tra DB trước đó thấy 25 cửa hàng |
| Admin API không token | HTTP 401 tại `/api/v1/products/admin/all` |
| Frontend production routes | `/` và `/admin/products/new` đều HTTP 200 |
| Tool search/details/sizes | Smoke read-only cho dữ liệu thật của sản phẩm `p003` đạt |
| Outfit trong ngân sách | `p027` 349.000đ + `p005` 549.000đ = 898.000đ |
| Thay áo trong outfit | Giữ `p005`, thay bằng `p003` 339.000đ; tổng 888.000đ |
| Gemini live | Chưa đạt: request `gemini-3.5-flash` trả HTTP 504 `DEADLINE_EXCEEDED` |
| Ảnh sản phẩm | Một ảnh `p003` trả HTTP 404 qua frontend media proxy |
| Admin create/edit | Chưa thử — cần xác thực và sẽ ghi dữ liệu thật |

## Database và an toàn dữ liệu

- Health API hiện báo 37 sản phẩm, không phải 38 như báo cáo kiểm toán cũ.
- Kiểm tra chỉ đọc trước đó xác nhận 5 migration hoàn tất và bảng `stores` có 25 bản ghi; không chạy migration trong phiên này.
- Không tạo/sửa/xóa dữ liệu sản phẩm, đơn hàng, media hoặc khách hàng.
- Không tạo backup DB mới. Script backup hiện có không bao gồm đầy đủ dữ liệu nhị phân `media_files`, nên chưa đủ điều kiện làm backup trước khi ghi DB.

## Hạn chế và việc còn lại

1. **Gemini:** Xác nhận quota/model khả dụng trong tài khoản đã cấu hình, sau đó chạy lại kịch bản tool call live. Test mock không thay thế được xác nhận này.
2. **Media:** Ảnh `p003` tham chiếu tới file không có trong backend/frontend uploads và proxy trả 404. Có 906 file nguồn, nhưng không có tên file/thư mục khớp sản phẩm để gán chắc chắn. Không tự chọn ảnh hoặc sửa DB.
3. **Admin:** Cần tài khoản admin được cấp và backup đầy đủ gồm BLOB để kiểm thử tạo/sửa sản phẩm an toàn.
4. **Lint:** Còn 76 cảnh báo hiện hữu, không có lỗi ESLint.

## File chính

- Backend: `backend/src/services/aiService.js`, `backend/src/services/geminiService.js`, `backend/src/services/productService.js`, `backend/src/services/stockReservationService.js`, `backend/src/services/conversationService.js`.
- Agent: `backend/src/services/fashionAgentService.js`, `backend/src/services/fashionAgentTools.js`.
- Admin: `frontend/components/admin/ProductForm.jsx`, `frontend/components/admin/VariantEditor.jsx`.
- Kiểm thử: `backend/tests/test_fashion_agent_service.js`, `backend/tests/test_fashion_agent_tools.js`, `backend/tests/test_ai_outfit_budget.js`, `backend/tests/test_stock_reservation_service.js`.
- Chi tiết theo giai đoạn: `docs/PROGRESS_LOG.md`; kịch bản: `docs/DEMO_SCRIPT.md`.
