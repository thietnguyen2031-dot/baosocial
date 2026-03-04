# BaoSocial - Nền tảng Tin tức Thế hệ Mới (News Platform)

BaoSocial là một nền tảng tổng hợp tin tức tự động, kết hợp công nghệ Trí tuệ Nhân tạo (AI Gemini) để viết lại nội dung chuẩn SEO, chống đạo văn và tối ưu hóa trải nghiệm người dùng. Dự án được thiết kế theo kiến trúc Monorepo hiện đại, phục vụ mục đích xây dựng các trang tin tức vệ tinh (News sites) mạnh mẽ, tự động và chuẩn SEO thực chiến.

## 🌟 Chức Năng Cốt Lõi (Tính đến hiện tại)

### 1. Tự Động Hóa & AI (Auto-Pilot)
- **Crawler RSS Thông Minh:** Tự động thu thập tin tức từ các nguồn RSS được cấp phép, lọc trùng lặp qua hệ thống Database.
- **Tích hợp Gemini AI:** 
  - Tự động viết lại nội dung (Rewrite) bằng văn phong báo chí chuẩn mực, giữ nguyên ý nghĩa gốc.
  - Hỗ trợ đa key (API Key Rotation) giúp xoay vòng giới hạn Quota của bản miễn phí (Tier 0).
  - Tự động fallback giữa model `gemini-3-flash-preview` và `gemini-2.5-flash` khi hết giới hạn.
- **Tối Ưu SEO Cấp Cao (4 Tầng):**
  - AI tự định hình **Long-tail keywords** trên tiêu đề để dễ rank top.
  - Tự động trích xuất nội dung tạo khối **Hỏi & Đáp (FAQ)** chuẩn Schema.
  - Tự động đính kèm liên kết **Nguồn tham khảo** để tăng độ Trust (E-E-A-T).

### 2. Frontend (Giao Diện & Trải Nghiệm Khách)
- Xây dựng bằng Next.js 14+ (App Router), SSR/ISR kết hợp.
- Giao diện thân thiện thiết kế bởi TailwindCSS + Shadcn UI.
- Sơ đồ trang web (`sitemap.xml`) và Nguồn cấp dữ liệu RSS (`rss.xml`) tự động cập nhật cực nhanh với Next.js ISR (Vercel Edge).
- Hệ thống Structured Data (JSON-LD) cho tổ chức, Breadcrumb và bài viết tin tức đầy đủ.
- Hệ thống Canonical URLs chuẩn xác, ép index đúng domain `www.` để phòng ngừa trùng lặp nội dung.

### 3. Backend & Quản Trị Hệ Thống (Admin)
- API viết bằng Express.js trên Node.js.
- Dashboard quản trị mạnh mẽ:
  - Cấu hình thông tin Website động (Tên site, Mô tả).
  - Cấu hình nhiều Gemini API Keys dạng danh sách.
  - Theo dõi trạng thái Quota (Giới hạn AI API).
  - Chức năng duyệt bài hàng loạt (Bulk Auto SEO).
  - Theo dõi tin tức đã đồng bộ qua Log hệ thống theo thời gian thực.
- **Auto-post Social:** Hỗ trợ tính năng bắn Webhook. Khi một bài viết được chốt hạ xuất bản (PUBLISHED), hệ thống sẽ gửi luồng dữ liệu cấu trúc cực gọn tới các nền tảng Tự động hóa như Zapier / Make.com để post ngay lên Facebook, Twitter/X, LinkedIn.

### 4. Database (Dữ Liệu)
- Sử dụng Neon Tech Serverless PostgreSQL cho tốc độ truy vấn cao.
- Quản lý Schema chuyên nghiệp bằng Drizzle ORM.
- Tự động xử lý dọn dẹp kí tự trắng (trim spaces) từ database để đảm bảo RSS Feed và hiển thị web luôn gọn gàng.

---

## 🛠️ Stack Công Nghệ

| Thành Phần | Công Nghệ |
| --- | --- |
| **Framework Frontend** | Next.js 14+ (App Router), React |
| **Styling** | Tailwind CSS, Shadcn UI |
| **Backend API** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **AI Integration** | Google Gemini (GenAI SDK) |
| **Hosting Deployment** | Vercel (Frontend), Render (Backend) |
| **Monorepo Manager** | Turborepo |

---

## 🚀 Hướng Dẫn Cài Đặt (Local Development)

### Yêu Cầu Đầu Vào
- Node.js (v18.0.0 trở lên)
- pnpm (Khuyên dùng)
- PostgreSQL Database URL (Có thể tạo miễn phí tại Neon.tech)
- Ít nhất 1 API Key của Google Gemini

### Bước 1: Clone dự án
```bash
git clone https://github.com/your-repo/baosocial.git
cd baosocial
```

### Bước 2: Cài đặt Dependencies
Tiến hành cài đặt các gói cần thiết bằng lệnh:
```bash
pnpm install
```

### Bước 3: Cấu Hình Biến Môi Trường (.env)
Tạo tệp `.env` tại thư mục gốc và sao chép cấu trúc từ `.env.example` (nếu có). Các cấu hình tối thiểu bao gồm:

```env
# Drizzle Database Connection
DATABASE_URL="postgres://user:password@hello-world.neon.tech/dbname?sslmode=require"

# API & Frontend URLs (Cấu hình domain của bạn khi lên Prod)
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Telegram Bot (Tùy chọn cho tính năng duyệt tin qua Telegram)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_ADMIN_CHAT_ID="your-chat-id"

# Webhook Auto-share Social (Make.com, Zapier) - Có thể điền trong Admin UI
# SOCIAL_WEBHOOK_URL="https://hook.make.com/xxxxxx"

# Cấu hình Google Drive Upload Ảnh Hàng Loạt
# GOOGLE_DRIVE_FOLDER_ID="your_folder_id"
# GOOGLE_DRIVE_CREDENTIALS='{"type":"service_account","project_id":"..."}'
```

### Bước 4: Khởi Tạo Cơ Sở Dữ Liệu
Push các cấu trúc bảng mẫu vào Database PostgreSQL của bạn theo đúng kiến trúc của Drizzle ORM:
```bash
pnpm db:push
```

### Bước 5: Chạy Máy Chủ Phát Triển (Dev Server)
Khởi động song song cả Frontend và Backend bằng Turborepo:
```bash
pnpm dev
```
- Frontend có thể truy cập tại: `http://localhost:3000`
- Backend API có thể truy cập tại: `http://localhost:3001`

---

## 🌍 Hướng Dẫn Kích Hoạt Đăng Bài Tự Động (Social Webhook)
Để tự động đăng bài viết lên Facebook / X ngay khi được duyệt `PUBLISHED`:
1. Tạo một Scenario trên trang [Make.com](https://make.com) / Zapier.
2. Chọn module nhận dữ liệu là **Webhook -> Custom Webhook**, và sao chép đoạn URL Webhook được sinh ra.
3. Vào trang Quản trị Admin của website -> `Cài đặt hệ thống` -> Tạo 1 Key cấu hình: `social_webhook_url`, Paste URL vừa copy vào ô Value.
4. Trở lại Make.com, kết nối nối Module Webhook đó sang Module Facebook Pages hoặc Twitter (X) là nội dung của bạn sẽ tự động lên sóng.

---

> LƯU Ý: Đây là tài liệu Động (Living Document). Các chức năng và luồng công nghệ sẽ tiếp tục được cập nhật và bổ sung qua thời gian.
