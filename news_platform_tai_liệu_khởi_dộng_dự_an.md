# NEWS PLATFORM – TÀI LIỆU KHỞI ĐỘNG DỰ ÁN (NEON-FIRST)

## 1. Mục tiêu dự án
Xây dựng một **nền tảng tin tức hiện đại** cho phép:
- Tự động thu thập tin từ RSS feed (được cấp phép)
- AI (Gemini) viết lại nội dung giữ nguyên ý nghĩa, tránh trùng lặp
- Hiển thị nội dung tối ưu SEO
- Người dùng đăng nhập, lưu tin yêu thích, bình luận và theo dõi phản hồi

Định hướng: **Web App hiện đại, linh động hơn web báo truyền thống** nhưng vẫn thân thiện người dùng phổ thông.

---

## 2. Chiến lược kiến trúc tổng thể

### 2.1 Nguyên tắc
- SEO là ưu tiên số 1
- Performance + TTFB thấp
- Dễ mở rộng (AI, cá nhân hóa)
- Tách biệt rõ: crawl – xử lý – hiển thị

---

## 3. Tech Stack chính thức (CHỐT)

### Frontend
- Next.js 14+ (App Router)
- TailwindCSS
- Shadcn UI
- SSR + SSG + ISR
- Deploy: **Vercel**

### Backend
- Node.js
- Express.js (hoặc API Routes riêng nếu muốn gọn)
- Deploy: **Render**

### Database Strategy (RẤT QUAN TRỌNG)

#### Primary Database (Production)
- **Neon PostgreSQL (Serverless)**
- Chịu tải SSR, crawl, user traffic
- ORM: **Drizzle ORM**

#### Secondary Database (Backup / Archive)
- PostgreSQL trên **Hosting INet**
- Dùng để:
  - Backup dữ liệu
  - Lưu raw RSS
  - Lưu log hệ thống

### AI Integration
- Gemini API
- Module riêng biệt để:
  - Rewrite nội dung
  - Giữ nguyên nghĩa
  - Văn phong báo chí

---

## 4. Kiến trúc luồng hệ thống

```
RSS Feed
   ↓
Crawler Service
   ↓
Raw Content (INet DB)
   ↓
AI Rewrite (Gemini)
   ↓
Neon PostgreSQL (DB chính)
   ↓
Backend API
   ↓
Frontend (Next.js)
```

---

## 5. Cấu trúc Monorepo đề xuất

```
/apps
  /web      → Next.js frontend
  /api      → Backend API (Express)
/packages
  /db       → Drizzle schema + config
  /ai       → Gemini integration
  /crawler  → RSS crawl logic
```

---

## 6. Database Schema (Logic Level)

### Users
- id
- email
- password_hash
- created_at

### Articles
- id
- title
- slug
- summary
- content_ai
- source_url
- published_at

### Comments
- id
- user_id
- article_id
- parent_id (reply)
- content
- created_at

### Favorites
- user_id
- article_id

---

## 7. Cấu trúc URL chuẩn SEO

- Trang chủ: `/`
- Chuyên mục: `/the-gioi`, `/cong-nghe`
- Bài viết: `/tin/{slug}`
- Trang cá nhân: `/u/{username}`

KHÔNG nhét ID vào URL
Slug rõ nghĩa – dễ crawl

---

## 8. CẤU TRÚC SEO CHUẨN (RẤT QUAN TRỌNG)

### 8.1 Nguyên tắc SEO cốt lõi
- URL ngắn, rõ nghĩa, không chứa ID
- Nội dung render được HTML ngay lần tải đầu (SSR/SSG)
- Mỗi bài viết có metadata riêng biệt
- Internal link mạnh giữa các bài cùng chủ đề
- Tốc độ tải (TTFB, LCP) < 2s

---

### 8.2 Cấu trúc URL đề xuất

| Loại trang | URL | Ghi chú SEO |
|----------|-----|------------|
| Trang chủ | `/` | Tổng hợp tin mới |
| Chuyên mục | `/chu-de/{slug}` | Crawl tốt, dễ mở rộng |
| Bài viết | `/tin/{slug}` | URL chính, canonical |
| Trang tác giả | `/tac-gia/{slug}` | E-E-A-T |
| Trang user | `/u/{username}` | Noindex |

KHÔNG dùng dạng:
- `/tin?id=123`
- `/tin/2025/01/slug`

---

### 8.3 Metadata cho bài viết (Next.js)

Mỗi bài viết cần:
- `<title>`: Tiêu đề + tên site
- `<meta description>`: 140–160 ký tự
- OpenGraph + Twitter Card
- Canonical URL

---

### 8.4 Structured Data (Schema.org)

Áp dụng schema:
- `NewsArticle`
- `BreadcrumbList`
- `Organization`

Mục tiêu:
- Rich Result
- Google Discover

### 8.5 Chiến lược SEO 4 Tầng (Thực chiến)

#### 🥇 TẦNG 1: Chọn từ khóa đúng (Quan trọng nhất)
- **Không target từ khóa quá rộng**: Ví dụ: `chip nvidia trung quoc` (Cạnh tranh cực cao, khó lên top).
- **Target Long-tail keyword (Từ khóa ngách/dài)**: Ví dụ: `Nvidia H20 bị cấm xuất khẩu sang Trung Quốc 2026` hoặc `Chính sách mới Mỹ siết chip AI Nvidia tại Trung Quốc`.
- Long-tail keyword mang lại chuyển đổi tốt và cực kỳ dễ gắn lên top cho site mới.

#### 🥈 TẦNG 2: Viết bài chuẩn SEO thực chiến
Cấu trúc cho mỗi bài viết sinh ra từ AI hoặc viết tay phải thoả mãn:
1. **Title chuẩn**: Ví dụ `Mỹ Siết Xuất Khẩu Chip Nvidia H20 Sang Trung Quốc: Tác Động Đến AI 2026` (Phải chứa cụm Keyword + Bối cảnh cụ thể).
2. **H1 duy nhất**: Mỗi trang URL chỉ tồn tại duy nhất 1 thẻ `<h1>`.
3. **Độ dài bài viết**: Cố gắng đạt `1000–1500 từ` (Báo lớn thường 800–2000 từ, bài ngắn 300 từ rất khó cạnh tranh).
4. **Mục FAQ cuối bài**: Bắt buộc thêm các câu hỏi thường gặp. Ví dụ: *Chip Nvidia H20 là gì? Vì sao Mỹ cấm? Trung Quốc có giải pháp thay thế không?* (Google cực kỳ thích cấu trúc hỏi đáp FAQ Schema).

#### 🥉 TẦNG 3: Tăng tốc index & crawl
Sau khi đăng bài mới, cần thực hiện hệ thống hoặc thủ công:
- **Tự động**: Sitemap & RSS feed phải cập nhật tức thì.
- **Thủ công (Nếu bài quan trọng)**: Submit URL Inspection qua Google Search Console.
- **Social Signals**: Share lên Facebook Page, X (Twitter).
- **Internal Link**: Bắt buộc trỏ link từ 2–3 bài viết cũ (có traffic) lồng sang bài mới để bot đi theo.

#### 🏆 TẦNG 4: Tăng authority (Off-page)
News site không có độ Trust sẽ không đè nổi báo lớn, bắt buộc phải có kế hoạch build Authority:
- Kiếm 20–50 backlink thật chất lượng.
- Phân bổ 1–2 bài guest post trên hệ thống cùng ngành.
- Rải link từ diễn đàn, blog, hoặc các nền tảng Web 2.0 (Ví dụ: Medium, Blogger, LinkedIn Articles).

### 8.5 Nội dung AI & SEO

- AI rewrite giữ nguyên ý nghĩa
- Không thay đổi số liệu, tên riêng
- Có đoạn mở đầu (lede) rõ ràng
- Chèn heading H2/H3 hợp lý
- Không spin từ khóa

---

### 8.6 Internal Linking Strategy

- Mỗi bài viết link 3–5 bài liên quan
- Ưu tiên cùng chuyên mục
- Anchor text tự nhiên

---

### 8.7 Sitemap & Robots

- Sitemap động `/sitemap.xml`
- Chia sitemap theo chuyên mục
- Robots.txt cho phép crawl `/tin/*`

---

### 8.8 Cache & Revalidation

- Dùng ISR cho trang tin
- Revalidate khi có bài mới
- Không cache trang user

---

## 9. Quy trình Crawl & Publish

1. Cron job gọi RSS
2. Lưu raw content → INet DB
3. Gọi Gemini rewrite
4. Validate nội dung
5. Lưu bài viết → Neon DB
6. Revalidate cache frontend

---

## 10. Lộ trình triển khai

### Giai đoạn 1 – MVP
- Crawl RSS 1 nguồn
- Rewrite AI
- Hiển thị tin

### Giai đoạn 2 – User
- Đăng nhập
- Favorite
- Comment

### Giai đoạn 3 – Tối ưu
- Cache
- SEO nâng cao
- Gợi ý tin

---

## 11. Hướng mở rộng tương lai
- AI tóm tắt nhanh
- Cá nhân hóa feed
- Push notification
- Mobile app

---

## 12. Kết luận

- **Neon là DB chính – không tranh cãi**
- INet DB dùng hợp lý, không bỏ phí
- Kiến trúc đủ mạnh để scale
- Phù hợp làm lâu dài

Tài liệu này dùng làm blueprint chính thức để bắt đầu code.

