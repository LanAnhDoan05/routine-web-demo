# Routine — Smart Fashion E-Commerce & AI Stylist Platform

> **Nền tảng thương mại điện tử thời trang cao cấp** kết hợp công nghệ **Smart Outfit**, **Trợ lý tư vấn tạo mẫu ảo AI Stylist thế hệ mới** (tích hợp Google Gemini AI & Bộ chuẩn hóa ngữ nghĩa thời trang tiếng Việt), **Hệ sinh thái phân tích tiếp thị đa nền tảng (Omni-channel Analytics)**, cổng thanh toán trực tuyến **VNPay Sandbox** và hệ thống quản trị **Admin Portal** hoàn chỉnh.

---
## 📌 Mục lục

1. [Giới thiệu tổng quan & Giá trị dự án](#1-giới-thiệu-tổng-quan--giá-trị-dự-án)
2. [Kiến trúc hệ thống & Ngăn xếp công nghệ (Tech Stack)](#2-kiến-trúc-hệ-thống--ngăn-xếp-công-nghệ-tech-stack)
3. [Các phân hệ & Tính năng đột phá](#3-các-phân-hệ--tính-năng-đột-phá)
   - [3.1 Trợ lý Thời trang AI Stylist Đa Lượt](#31-trợ-lý-thời-trang-ai-stylist-thế-hệ-mới-multi-turn-chat)
   - [3.2 Trải nghiệm mua sắm Storefront](#32-trải-nghiệm-mua-sắm-khách-hàng-storefront)
   - [3.3 Hệ sinh thái Tiếp thị Đa Nền tảng (Omni-channel Analytics)](#33-hệ-sinh-thái-tiếp-thị-đa-nền-tảng-omni-channel-analytics)
   - [3.4 Hệ thống Đánh giá & Phân quyền Sản phẩm (Reviews & Ratings)](#34-hệ-thống-đánh-giá--phân-quyền-sản-phẩm-reviews--ratings)
   - [3.5 Cổng Quản trị Vận hành Toàn diện (Admin Portal)](#35-cổng-quản-trị-vận-hành-toàn-diện-admin-portal)
   - [3.6 Cơ chế Kỹ thuật Chuyên sâu & Bảo mật](#36-cơ-chế-kỹ-thuật-chuyên-sâu--bảo-mật)
   - [3.7 Tìm kiếm Vector & Đóng khung AI (RAG Grounding)](#37-tìm-kiếm-vector--đóng-khung-ai-rag-grounding)
4. [Tài khoản Demo thử nghiệm (Demo Credentials)](#4-tài-khoản-demo-thử-nghiệm-demo-credentials)
5. [Cấu trúc thư mục dự án](#5-cấu-trúc-thư-mục-dự-án)
6. [Yêu cầu môi trường (Prerequisites)](#6-yêu-cầu-môi-trường-prerequisites)
7. [Hướng dẫn cài đặt & Cấu hình chi tiết](#7-hướng-dẫn-cài-đặt--cấu-hình-chi-tiết)
   - [Bước 1: Thiết lập Cơ sở dữ liệu (MySQL)](#bước-1-thiết-lập-cơ-sở-dữ-liệu-mysql)
   - [Bước 2: Cài đặt & Cấu hình Backend](#bước-2-cài-đặt--cấu-hình-backend)
   - [Bước 3: Cài đặt & Cấu hình Frontend](#bước-3-cài-đặt--cấu-hình-frontend)
   - [Bước 4: Kiểm tra cấu hình](#bước-4-kiểm-tra-cấu-hình)
8. [Cách khởi chạy dự án (How to Run)](#8-cách-khởi-chạy-dự-án-how-to-run)
9. [Tài liệu API Endpoints Chi tiết](#9-tài-liệu-api-endpoints-chi-tiết)
10. [Chạy các kịch bản kiểm thử tự động (Automated Tests)](#10-chạy-các-kịch-bản-kiểm-thử-tự-động-automated-tests)
11. [Khắc phục sự cố thường gặp (Troubleshooting)](#11-khắc-phục-sự-cố-thường-gặp-troubleshooting)

---

## 1. Giới thiệu tổng quan & Giá trị dự án

**Routine_web** là nền tảng thương mại điện tử chuyên ngành thời trang tối giản và hiện đại, xây dựng theo kiến trúc **Monorepo (Frontend và Backend phân tách độc lập)**:
- **Khách hàng (Customer)**: Mua sắm liền mạch, chọn mua trọn gói set phối đồ thông minh (**Smart Outfit**), trò chuyện tự nhiên với **AI Stylist** bằng ngôn ngữ đời thường (hiểu tiếng lóng form dáng: *“rộng/thùng thình”* $\rightarrow$ *oversize*, *“ôm/gọn”* $\rightarrow$ *slim-fit*), giữ chỗ kho tự động và thanh toán linh hoạt (COD / VNPay).
- **Bộ phận Tiếp thị (Marketing & Growth)**: Tự động gắn tag nguồn tiếp cận (TikTok, Facebook, Instagram, Google) từ lúc khách truy cập vãng lai, theo dõi tỷ lệ chuyển đổi (Conversion Rate) và doanh thu thực tế theo từng kênh.
- **Quản trị viên (Admin)**: Quản trị tập trung tại `/admin` về sản phẩm, bộ phối thời trang, đơn hàng, mã giảm giá, kiểm duyệt đánh giá và phễu khách hàng.

---

## 2. Kiến trúc hệ thống & Ngăn xếp công nghệ (Tech Stack)

### Sơ đồ kiến trúc tổng thể

```mermaid
graph TD
    Client["Client (Trình duyệt Web - Máy tính & Di động)"]
   FE["Frontend (Next.js 16 App Router) - Port 3000"]
    BE["Backend (Express.js REST API) - Port 5001"]
   VEC["Native vector search / RAG"]
   DB[("MySQL Database (Aiven defaultdb hoặc local MySQL)")]
    Prisma["Prisma ORM 6"]
   Gemini["Google GenAI SDK (gemini-3.8-flash)"]
    Thesaurus["Từ điển Ngữ nghĩa Thời trang Việt (fashionThesaurus.js)"]
    VNPay["Cổng thanh toán VNPay Sandbox"]
    SMTP["Gmail SMTP (Nodemailer)"]

    Client -->|SSR / CSR / JSON| FE
    FE -->|REST API /api/v1| BE
    BE -->|Prisma Client| Prisma
    Prisma -->|Query / Transaction| DB
    BE -->|Intent & Multi-turn Chat| Gemini
    BE -->|Local Semantic Parser & Fallback| Thesaurus
   BE -->|Native vector search & RAG| VEC
   VEC -->|Product lookup| Prisma
   BE -->|Google GenAI SDK| Gemini
    BE -->|HMAC-SHA512 Payment & Return| VNPay
    BE -->|OTP & Order Invoices| SMTP
```

### Chi tiết công nghệ sử dụng

| Tầng | Công nghệ | Phiên bản | Vai trò & Điểm nổi bật |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Next.js (App Router)** | 16.4.3 | Tối ưu SEO, Server-Side Rendering (SSR), Client Components, Dynamic Routing. |
| | **React** | 19.3.1 | Context API quản trị trạng thái Giỏ hàng, Tài khoản, Yêu thích, Đặt hàng. |
| | **CSS Modules** | Pure CSS | Giao diện tối giản, sang trọng theo chuẩn Brand Identity của Routine, 100% Responsive. |
| **Backend** | **Node.js & Express** | Express 4.22 | Xây dựng RESTful API tại `/api/v1`, kiến trúc Controller - Service - Route rõ ràng. |
| | **Prisma ORM** | 6.19.3 | Quản trị 16 Models CSDL với quan hệ chặt chẽ, hỗ trợ Migration và Atomic Transaction. |
| | **Database** | MySQL 8.0 | Lưu trữ bền vững dữ liệu sản phẩm, đơn hàng, tồn kho, khách hàng và tracking. |
| **Trí tuệ nhân tạo (AI)** | **Google GenAI SDK** | `@google/genai` | Model cấu hình qua `GEMINI_MODEL` (mặc định `gemini-3.8-flash`); API key chỉ nằm ở backend. |
| | **Fashion Thesaurus** | Thuần JS | Bộ từ điển từ đồng nghĩa thời trang tiếng Việt độc quyền, chuẩn hóa từ ngữ tự nhiên về SQL query. |
| **Vector Search & RAG** | **Native Node.js** | JavaScript | Tìm kiếm theo tọa độ vector sản phẩm trong backend; Gemini chỉ diễn đạt tư vấn dựa trên sản phẩm đã truy xuất. |
| **Thanh toán & Bảo mật**| **VNPay Sandbox** | `vnpay` 2.5.0 | Thanh toán online an toàn qua VNPAY-QR, Thẻ ATM/Nội địa và Thẻ quốc tế. |
| | **JWT & Bcryptjs** | JWT 9.0 | Xác thực phân quyền `CUSTOMER` / `ADMIN`, hash mật khẩu an toàn. |
| | **Helmet & Rate Limit**| Helmet 8.3 | Chống tấn công DDoS, bảo vệ Header HTTP và giới hạn 25 req/phút cho luồng AI. |
| **Truyền thông** | **Nodemailer** | 10.0.1 | Gửi mã OTP đăng ký / quên mật khẩu và email hóa đơn đơn hàng chuyên nghiệp. |


---

## 3. Các phân hệ & Tính năng đột phá

### 3.1 Trợ lý Thời trang AI Stylist Thế hệ Mới (Multi-turn Chat)

Không đơn thuần là chatbot thông thường, AI Stylist của Routine kết hợp giữa **mô hình ngôn ngữ lớn (LLM)** và **bộ từ điển nghiệp vụ thời trang cục bộ**:

1. **Bộ chuẩn hóa ngữ nghĩa thời trang tiếng Việt ([fashionThesaurus.js](backend/src/utils/fashionThesaurus.js))**:
   - Tự động quy đổi từ ngữ đời thường về thuộc tính trong database:
     - Form dáng: *“lớn”*, *“to”*, *“bự”*, *“rộng”*, *“thùng thình”* $\rightarrow$ `oversize`; *“ôm”*, *“bó”*, *“gọn”* $\rightarrow$ `slim-fit`.
     - Danh mục: *“áo phông”*, *“tee”* $\rightarrow$ `ao-thun`; *“quần bò”*, *“denim”* $\rightarrow$ `quan-jeans`; *“quần âu”* $\rightarrow$ `quan-tay`.
     - Màu sắc & Ngân sách: *“màu ghi”* $\rightarrow$ `xám`; *“dưới 600k”* $\rightarrow$ `budget: 600000`.
2. **Hội thoại Đa Lượt & Nhớ Ngữ Cảnh (Multi-turn Context Memory)**:
   - Khi người dùng chọn một bộ đồ mẫu hoặc nhập yêu cầu, hệ thống lưu vết các món đang có trong set.
   - Khi người dùng chat tiếp: *“Đổi sang quần khác để phối”*, AI tự động đưa quần cũ vào `excludeProductNames` (-1.000 điểm phạt) và giữ nguyên áo cũ (`keepProductNames` +500 điểm ưu tiên) để tạo set mới hài hòa mà không lặp lại món cũ.
3. **Bộ lọc Chào hỏi Thông minh (`isGreetingOrGeneralChat`)**:
   - Khi người dùng chỉ chào hỏi (*“xin chào”*, *“hello”*, *“bạn là ai”*), AI phản hồi thân mật và **không hiển thị trang phục (`outfit: null`)**, đồng thời cung cấp 4 nút gợi ý nhanh để bắt đầu.
4. **Thẻ Trang phục Tương tác ([InteractiveOutfitCard.jsx](frontend/components/ai/InteractiveOutfitCard.jsx))**:
   - Cho phép chọn Size (S/M/L/XL) và Màu sắc trực tiếp ngay trong khung chat.
   - Nút **"🛍️ Thêm trọn bộ vào giỏ hàng"** (1-click thêm toàn bộ các món trong set) hoặc mua lẻ từng món.
5. **AI Stylist Floating Widget Toàn Trang ([AIStylistFloatingWidget.jsx](frontend/components/ai/AIStylistFloatingWidget.jsx))**:
   - Nút nổi ở góc dưới bên phải màn hình mọi trang, tự động gợi ý phối đồ hoàn chỉnh ("Complete The Look") khi khách đang xem trang chi tiết sản phẩm bất kỳ.
6. **Cơ chế Fast-Failover chống treo**:
   - Tự động chuyển đổi mượt sang thuật toán ghép đồ động nội bộ trong **0.005 giây** nếu mạng Google Gemini quá tải (429/timeout), đảm bảo ứng dụng luôn phản hồi tức thì.

---

### 3.2 Trải nghiệm mua sắm khách hàng (Storefront)
- **Smart Outfit**: Khám phá các set đồ mẫu theo sự kiện: Công sở, Hẹn hò, Dạo phố, Dự tiệc.
- **Giỏ hàng khách vãng lai (Guest Session Isolation)**: Sử dụng token `x-session-id` độc lập cho từng trình duyệt, không bị gộp giỏ hàng chung IP khi nhiều người lướt cùng mạng Wi-Fi. Tự động merge giỏ hàng vào tài khoản khi khách đăng nhập.
- **Giữ chỗ tồn kho (Atomic Stock Reservation)**: Khóa tạm thời số lượng sản phẩm trong kho khi khách đặt hàng hoặc chọn thanh toán VNPay, tự động hoàn trả kho nếu hủy đơn hoặc hết hạn thanh toán.
- **Thanh toán đa phương thức**: COD (nhận hàng thanh toán) và VNPay Sandbox (thẻ ATM nội địa, QR Code, thẻ quốc tế).

---

### 3.3 Hệ sinh thái Tiếp thị Đa Nền tảng (Omni-channel Analytics)
- Tự động bắt tham số chiến dịch tiếp thị qua URL (`?utm_source=tiktok`, `?ref=facebook`, `?source=instagram`).
- Lưu trữ nguồn khách hàng từ lúc còn là Khách vãng lai (`GuestSession.platform`) $\rightarrow$ Khách đăng ký (`User.source`) $\rightarrow$ Đơn hàng thành công (`Order.attributionSource`).
- **Dashboard Phân tích dành cho Admin (`/admin`)**:
  - Thống kê tỷ lệ chuyển đổi (Conversion Rate %), số lượt click, số khách đăng ký và doanh thu chi tiết theo từng nền tảng TikTok, Facebook, Instagram, Google.
  - Quản lý danh sách khách vãng lai và theo dõi lịch sử sản phẩm khách đã xem.

---

### 3.4 Hệ thống Đánh giá & Phân quyền Sản phẩm (Reviews & Ratings)
- Khách hàng xem đánh giá, điểm sao trung bình và hình ảnh phản hồi thực tế của sản phẩm.
- Chỉ thành viên đã đăng nhập mới được gửi đánh giá kèm số sao (1 đến 5 sao) và hình ảnh minh họa.
- **Phân quyền bảo mật**: Khách hàng chỉ có quyền chỉnh sửa/xóa bài đánh giá của chính mình; Quản trị viên (Admin) có quyền kiểm duyệt và xóa các đánh giá không phù hợp trên toàn hệ thống.

---

### 3.5 Cổng Quản trị Vận hành Toàn diện (Admin Portal)
Truy cập tại: `http://localhost:3000/admin`
- **Dashboard**: Thống kê doanh thu, đơn hàng, khách hàng và biểu đồ phân bổ nguồn tiếp thị.
- **Quản lý Sản phẩm**: Thêm mới, chỉnh sửa giá, số lượng tồn kho, tải ảnh, phân loại phong cách.
- **Quản lý Outfits**: Tạo set phối đồ thông minh, gán sản phẩm vào set.
- **Quản lý Đơn hàng**: Cập nhật trạng thái đơn (Xác nhận, Đang giao, Hoàn tất, Hủy đơn).
- **Quản lý Vouchers**: Tạo mã giảm giá theo %, tiền cố định hoặc miễn phí vận chuyển.
- **Quản lý Khách hàng & Đánh giá**: Tra cứu thông tin khách hàng và phản hồi của người mua.

---

### 3.6 Cơ chế Kỹ thuật Chuyên sâu & Bảo mật
- **HTTP Cache Control**: Tắt ETag và thiết lập header `no-store, no-cache` để mọi thao tác CRUD và giỏ hàng luôn phản ánh dữ liệu mới nhất (HTTP 200 OK thay vì 304 Not Modified gây hiểu lầm).
- **Bảo mật Header (Helmet)**: Ngăn chặn tấn công Clickjacking, Cross-Site Scripting (XSS), MIME Sniffing.
- **Rate Limiting**: Giới hạn 100 req/15 phút cho API chung, 20 req/15 phút cho Auth (chống Brute-force mật khẩu), 25 req/phút cho AI Stylist.

---

### 3.7 Tìm kiếm Vector & Đóng khung AI (RAG Grounding)
Backend Node.js tự tìm sản phẩm theo vector tọa độ lưu trong MySQL; không có microservice Python/ChromaDB riêng trong checkout này. Backend chỉ đưa các sản phẩm đã truy xuất vào ngữ cảnh Gemini để tạo lời tư vấn, và vẫn có phản hồi local khi Gemini không được cấu hình hoặc tạm lỗi.

---

## 4. Tài khoản Demo thử nghiệm (Demo Credentials)

Repo không kèm dữ liệu seed hoặc tài khoản đăng nhập mẫu. Tạo tài khoản và phân quyền trong database MySQL của bạn; không dùng hoặc chia sẻ thông tin đăng nhập thật trong tài liệu công khai.

---

## 5. Cấu trúc thư mục dự án

```
Routine_web/
├── backend/                             # Máy chủ API (Node.js & Express.js)
│   ├── app.js                           # Khởi tạo Express, Helmet, RateLimiter, CORS, Router
│   ├── package.json                     # Danh mục dependencies & scripts
│   ├── bin/www                          # Entrypoint máy chủ HTTP (Port 5001)
│   ├── prisma/schema.prisma             # Định nghĩa 16 Data Models cho MySQL
│   ├── scripts/                         # Script trích xuất SQL & seeding dữ liệu
│   ├── src/
│   │   ├── config/                      # Cấu hình Prisma Client
│   │   ├── controllers/                 # Tầng tiếp nhận request & trả lời JSON
│   │   ├── middlewares/                 # auth.js (JWT), identifyUser.js, rateLimiter.js
│   │   ├── routes/                      # Định nghĩa các routes con & api.js tổng hợp
│   │   ├── services/                    # Tầng nghiệp vụ: aiService, cartService, orderService, vnpayService...
│   │   └── utils/                       # fashionThesaurus.js, response.js
│   └── test_*.js                        # Bộ kịch bản kiểm thử API tự động độc lập
│
├── frontend/                            # Giao diện Người dùng (Next.js 14 App Router)
│   ├── package.json                     # Dependencies: Next.js 16, React 19
│   ├── next.config.js                   # Cấu hình Next.js, proxy upload images
│   ├── jsconfig.json                    # Cấu hình path alias @/*
│   ├── app/                             # Next.js App Router
│   │   ├── layout.js                    # Root Layout bọc Context Providers, Header, Footer, Widget
│   │   ├── globals.css                  # Toàn bộ design tokens, màu sắc, phông chữ
│   │   ├── page.js                      # Trang chủ Routine
│   │   ├── admin/                       # Toàn bộ các trang quản trị Admin Portal
│   │   ├── cart/                        # Trang giỏ hàng
│   │   ├── category/[slug]/             # Danh mục sản phẩm (Nam, Nữ, Polo, Jeans...)
│   │   ├── checkout/                    # Thanh toán & tích hợp return VNPay
│   │   ├── orders/                      # Lịch sử và chi tiết đơn hàng
│   │   ├── product/[id]/                # Chi tiết sản phẩm & đánh giá
│   │   ├── smart-outfit/                # Trang Smart Outfit & /ai-stylist
│   │   └── wishlist/                    # Danh sách sản phẩm yêu thích
│   ├── components/                      # UI Components: ai, cart, checkout, common, layout...
│   ├── context/                         # React Context: CartContext, UserContext, WishlistContext...
│   ├── lib/                             # Client API fetchers: api.js, aiStylistService.js...
│   └── public/                          # Ảnh sản phẩm, icons, banners
│
├── package.json                         # Root scripts: npm run dev/build/lint
├── run_all.bat                          # Script Windows khởi chạy backend và frontend
└── README.md                            # Tài liệu hướng dẫn toàn diện dự án
```

---

## 6. Yêu cầu môi trường (Prerequisites)

- **Node.js**: Phiên bản `>= 20.9` (khuyến nghị Node 22 hoặc 24 LTS). Kiểm tra: `node -v`
- **npm**: Phiên bản `>= 10`. Kiểm tra: `npm -v`
- **MySQL Server**: Phiên bản `>= 8.0` (chạy qua XAMPP, Laragon, MySQL Installer hoặc Docker).
- Trình duyệt hiện đại: Chrome, Edge, Safari hoặc Firefox.

---

## 7. Hướng dẫn cài đặt & Cấu hình chi tiết

### Bước 1: Thiết lập Cơ sở dữ liệu (MySQL)
1. Dự án dùng MySQL qua Prisma. Nếu dùng database Aiven hiện có, lấy host, port, user và password tại Aiven Console; schema trong ảnh của bạn là `defaultdb`.
2. Repo có `backend/prisma/ca.pem` để xác thực TLS Aiven. Mẫu URL được ghi chú trong `backend/.env.example`.
3. Nếu dùng MySQL local mới, tạo database theo tên bạn chọn và dùng URL `mysql://USER:PASSWORD@localhost:3306/DB_NAME`.
4. Không chạy `prisma migrate deploy` hoặc `prisma db push` trên database đang có dữ liệu trước khi so sánh schema. Migration hiện có chỉ tạo bảng `stock_reservations`; checkout này không có dump SQL seed đầy đủ.

---

### Bước 2: Cài đặt & Cấu hình Backend
1. Mở Terminal và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo và chỉnh sửa file `.env`:
   ```bash
   cp .env.example .env     # Trên Linux/macOS
   copy .env.example .env   # Trên Windows PowerShell
   ```
   Điền `DATABASE_URL`, `JWT_SECRET` và `GEMINI_API_KEY` bằng giá trị riêng của bạn. Với Aiven, dùng mẫu sau và thay thông tin từ Console:
   ```env
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/defaultdb?sslaccept=strict&sslcert=./prisma/ca.pem"
   JWT_SECRET="<chuoi-ngau-nhien-dai>"
   GEMINI_API_KEY="<key-tu-Google-AI-Studio>"
   GEMINI_MODEL=gemini-3.8-flash
   GEMINI_TIMEOUT_MS=10000
   FRONTEND_URL=http://localhost:3000
   ```
   Mã hóa ký tự đặc biệt trong mật khẩu URL (ví dụ `@` thành `%40`). Không commit hoặc gửi file `.env`.
4. Sinh mã Prisma Client:
   ```bash
   npm run db:generate
   ```

---

### Bước 3: Cài đặt & Cấu hình Frontend
1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file `frontend/.env.local` từ `frontend/.env.example` hoặc đặt:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
   ```

---

### Bước 4: Kiểm tra cấu hình
Không cần cài Python service riêng. Vector search, RAG và Gemini được gọi trong backend Node.js. Sau khi cấu hình `backend/.env`, kiểm tra API `http://localhost:5001/api/v1/health`; readiness hợp lệ khi response có `dbStatus: connected`.

---

## 8. Cách khởi chạy dự án (How to Run)

### Cách 1: Chạy cả dự án (Windows)
Từ thư mục gốc repo, cài dependencies một lần:
```powershell
npm install
npm ci --prefix backend
npm ci --prefix frontend
```
Sau đó chạy hai ứng dụng cùng lúc:
```powershell
npm run dev
```
Frontend chạy tại `http://localhost:3000` (cũng có thể truy cập bằng `http://127.0.0.1:3000`), backend tại `http://localhost:5001`.

---

### Cách 2: Khởi chạy riêng từng phần

#### Terminal 1: Chạy Backend (API Server)
```bash
cd backend
npm start
```
- Server chạy tại: **`http://localhost:5001`**
- Kiểm tra Health-check: `http://localhost:5001/api/v1/health`

#### Terminal 2: Chạy Frontend (Storefront & Admin)
```bash
cd frontend
npm run dev
```
- Trang web hoạt động tại: **`http://localhost:3000`**

---

### Các trang chính cần trải nghiệm:
- **Trang chủ Storefront**: `http://localhost:3000`
- **Trợ lý AI Stylist Chatbot**: `http://localhost:3000/smart-outfit/ai-stylist`
- **Bộ sưu tập Smart Outfit**: `http://localhost:3000/smart-outfit`
- **Giỏ hàng**: `http://localhost:3000/cart`
- **Cổng Quản trị Admin**: `http://localhost:3000/admin` (cần tài khoản có quyền `ADMIN` trong database)

---

## 9. Tài liệu API Endpoints Chi tiết

Tất cả các endpoint đều có tiền tố `/api/v1`:

```json
{
  "success": true,
  "data": { ... },
  "message": "Thông báo trạng thái",
  "meta": { "pagination": ... }
}
```

| Nhóm chức năng | Phương thức | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| **Hệ thống** | `GET` | `/api/v1/health` | Kiểm tra tình trạng hoạt động của API Server |
| **Xác thực (Auth)** | `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới kèm nguồn `source` (TikTok, FB...) |
| | `POST` | `/api/v1/auth/verify-otp` | Xác thực mã OTP gửi về Email |
| | `POST` | `/api/v1/auth/login` | Đăng nhập hệ thống, trả JWT Token |
| | `GET` | `/api/v1/auth/me` | Lấy thông tin tài khoản hiện tại |
| | `POST` | `/api/v1/auth/forgot-password` | Yêu cầu mã OTP khôi phục mật khẩu |
| **AI Stylist** | `POST` | `/api/v1/ai/chat` | Chat đa lượt với AI Stylist, nhớ context đổi đồ |
| | `POST` | `/api/v1/smart-outfit/ai-stylist` | Alias tương thích ngược cho endpoint AI Chat |
| | `POST` | `/api/v1/ai/stylist` | Gợi ý set đồ theo tiêu chí tĩnh (cũ) |
| **Sản phẩm (Product)** | `GET` | `/api/v1/products` | Danh sách sản phẩm (lọc category, style, giá, size) |
| | `GET` | `/api/v1/products/:id` | Chi tiết sản phẩm theo ID hoặc Slug |
| | `GET` | `/api/v1/products/featured` | Danh sách sản phẩm nổi bật |
| | `GET` | `/api/v1/products/trending` | Danh sách sản phẩm bán chạy/thịnh hành |
| **Smart Outfit** | `GET` | `/api/v1/outfits` | Danh sách các bộ outfit mẫu phối sẵn |
| | `GET` | `/api/v1/outfits/:id` | Chi tiết outfit và các món đồ thành phần |
| **Giỏ hàng (Cart)** | `GET` | `/api/v1/cart` | Lấy giỏ hàng theo User ID hoặc `x-session-id` |
| | `POST` | `/api/v1/cart/items` | Thêm sản phẩm vào giỏ hàng |
| | `PATCH` | `/api/v1/cart/items/:lineId`| Điều chỉnh số lượng sản phẩm trong giỏ |
| | `DELETE` | `/api/v1/cart/items/:lineId`| Xóa sản phẩm khỏi giỏ hàng |
| | `POST` | `/api/v1/cart/merge` | Gộp giỏ hàng khách vào user sau khi đăng nhập |
| **Đơn hàng (Order)** | `POST` | `/api/v1/orders` | Tạo đơn hàng (tự động giữ kho & trừ tồn kho) |
| | `GET` | `/api/v1/orders` | Danh sách đơn hàng đã mua của khách |
| | `GET` | `/api/v1/orders/:id` | Chi tiết tiến độ và timeline đơn hàng |
| **Đánh giá (Review)** | `GET` | `/api/v1/reviews/product/:productId` | Lấy danh sách đánh giá của 1 sản phẩm |
| | `POST` | `/api/v1/reviews/product/:productId`| Thành viên gửi đánh giá sao và bình luận |
| | `DELETE` | `/api/v1/reviews/:reviewId`| Xóa đánh giá (chỉ chính chủ hoặc Admin) |
| **Tiếp thị (Analytics)**| `POST` | `/api/v1/analytics/track` | Ghi nhận click/view theo chiến dịch marketing |
| | `GET` | `/api/v1/analytics/admin/overview` | Báo cáo tỷ lệ chuyển đổi và doanh thu đa kênh |
| | `GET` | `/api/v1/analytics/admin/guests` | Giám sát lịch sử hành vi khách vãng lai |
| **Mã giảm giá** | `GET` | `/api/v1/coupons` | Danh sách voucher khả dụng |
| | `POST` | `/api/v1/coupons/apply` | Áp dụng voucher kiểm tra giảm giá |
| **Thanh toán VNPay** | `POST` | `/api/v1/payment/vnpay/create-payment-url` | Sinh link thanh toán VNPay Sandbox |
| | `GET` | `/api/v1/payment/vnpay/vnpay-return` | Xử lý phản hồi kết quả giao dịch VNPay |
| **Tìm kiếm Vector (Backend)** | `POST` | `/api/v1/search/vector` | Tìm sản phẩm theo vector trong backend và dữ liệu MySQL |
| | `POST` | `/api/v1/search/rag` | Hỏi AI Stylist có ngữ cảnh sản phẩm đã truy xuất |
| **Quản trị (Admin)** | `POST/PUT/DELETE` | `/api/v1/products` *(Admin)* | CRUD sản phẩm trong kho |
| | `POST` | `/api/v1/upload/image` *(Admin)* | Tải ảnh JPG/JPEG/PNG/WEBP; ảnh được lưu vào `media_files` và trả URL `/api/v1/media/:id` |
| **Ảnh công khai** | `GET` | `/api/v1/media/:id` | Trả ảnh từ MySQL; bản sao trên đĩa chỉ dùng khi khả dụng |
| | `PATCH` | `/api/v1/orders/:id/status` | Cập nhật trạng thái duyệt/giao đơn hàng |

---

## 10. Chạy các kịch bản kiểm thử tự động (Automated Tests)

Test AI input validation có thể chạy độc lập, không cần database hoặc API key:

```bash
npm --prefix backend run test:ai-validation
```

Các integration test còn lại trong `backend/tests/` cần MySQL test database đã seed. Chỉ chạy test có thể tạo/xóa dữ liệu trên database test, không chạy trực tiếp trên Aiven production.

---

## 11. Khắc phục sự cố thường gặp (Troubleshooting)

### 1. Lỗi cổng `5001` hoặc `3000` bị chiếm dụng (Port in use)
- **Xử lý**:
   - Mở PowerShell và chạy lệnh tìm PID: `netstat -ano | findstr :5001` (hoặc `:3000`)
  - Dừng tiến trình bằng: `taskkill /PID <PID> /F`

### 2. Lỗi `PrismaClientInitializationError: Can't reach database server`
- **Xử lý**: Kiểm tra lại dịch vụ MySQL trong XAMPP hoặc Services trên Windows xem đã ở trạng thái **Running** chưa. Xác nhận lại mật khẩu MySQL trong biến `DATABASE_URL` của file `.env`.
   - Với Aiven, kiểm tra đúng host/port, allowlist IP và cấu hình TLS `sslcert=./prisma/ca.pem`. `/api/v1/health` trả 503 cho tới khi DB sẵn sàng.

### 3. Lỗi Gemini API báo 429 hoặc treo phản hồi
- **Nguyên nhân**: Tài khoản Google AI Studio miễn phí có giới hạn số lượt gọi/phút.
- **Xử lý**: Kiểm tra `GEMINI_API_KEY`, quota và `GEMINI_MODEL` trong `backend/.env`. Gemini timeout hoặc lỗi sẽ dùng fallback local; không gửi API key từ frontend.

### 4. Lỗi hiển thị ảnh tải lên (404 khi xem ảnh)
- **Kiểm tra upload**: Chỉ nhận JPG/JPEG/PNG/WEBP; ảnh gốc tối đa 20MB và được tối ưu xuống tối đa 4MB trước khi gửi. API yêu cầu JWT Admin.
- **Cơ chế lưu**: Backend lưu ảnh vào bảng MySQL `media_files` và trả URL `/api/v1/media/:id`; file trên đĩa là bản sao tùy chọn. Frontend proxy URL này qua `app/api/v1/media/[id]/route.js`, vì vậy cấu hình `NEXT_PUBLIC_API_URL` phải trỏ đúng Backend.
- **Ảnh danh mục cũ**: API tự ánh xạ URL `.jpg` cũ trong `public/images/categories/` sang SVG tương ứng; các file `.jpg` đó thực chất chứa SVG và không được dùng trực tiếp như JPEG.


---

**Routine Web** — *Định hình phong cách thời trang tối giản, hiện đại và thông minh!* 🌟
