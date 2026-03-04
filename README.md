# BaoSocial - Next-Gen Automated News Platform

BaoSocial is an automated news aggregation platform powered by Artificial Intelligence (Google Gemini) built to rewrite news articles natively for SEO edge. It follows a multi-tier SEO strategy perfectly tailored for creating automated news websites to capture search traffic directly from Google.

## 🌟 Core Features (As of Date)

### 1. Automation & AI-Pilot
- **Smart RSS Crawler:** Autonomously fetches news from licensed RSS sources and seamlessly checks against an internal SQL database to dodge duplicates.
- **Gemini AI Integration:** 
  - Restructures and rewrites full-length articles mimicking human journalism while retaining the core facts, successfully preventing plagiarism penalties.
  - Built-in multi-key iteration (API Key Rotation) to bypass standard Quota Limits on free tiers.
  - Automatic fallback between `gemini-3-flash-preview` and `gemini-2.5-flash` to ensure robust AI up-time.
- **4-Tier Specialized SEO Generation:**
  - Employs Artificial Intelligence to structure titles aiming directly at **Long-tail keywords**.
  - Dynamically synthesizes an end-of-article **FAQ (Frequently Asked Questions) section** ensuring strict compliance with FAQ Scema semantics.
  - Automatically affixes an **Attribution Source Link** satisfying Google’s E-E-A-T trust signals.

### 2. Frontend (User Interface)
- Built vigorously utilizing Next.js 14+ (App Router) mixing SSR and ISR.
- Aesthetic, highly accessible styling designed using Tailwind CSS + Shadcn UI.
- Real-time automatic caching & updating of Sitemap (`sitemap.xml`) and RSS feeds (`rss.xml`) via Next.js ISR directly edge-rendered on Vercel.
- Integrated, fully operational Structured Data (JSON-LD Schema.org).
- Strictest SEO enforcement utilizing Canonical tags bound to custom domains (e.g. `www.`) preventing Google’s Duplicate Content flags.

### 3. Backend (API & Admin Dashboard)
- Node.js environment powered by Express.js.
- Comprehensive UI for administrators encompassing:
  - Dynamic System Settings injection (Title, Descriptions, Meta Values).
  - Bulk loading capabilities for multiple Gemini API Keys (JSON/array string).
  - Built-in Key usage trackers analyzing Daily Request Quotas.
  - One-click bulk processing functionalities for rewriting newly fetched raw RSS entries pending review.
  - **Auto-post Socials Setup:** Features an external webhook system. Whenever an article status turns `PUBLISHED` (auto or manual execution), the backend API emits a structural POST webhook containing the URL and image to third-party integrations (e.g. Make.com or Zapier) to be instantly mirrored on Facebook Pages, X (Twitter), LinkedIn, etc. 

### 4. Database Layer
- Scaled effectively using Serverless PostgreSQL supplied by Neon Tech (primary).
- Handled with Drizzle ORM to generate completely type-safe operations ensuring minimal query latency.
- Internal sanitization loops systematically removing DB field whitespace (trailing spaces) preserving neat XML rendering.

---

## 🛠️ Technology Stack

| Component | Tech Used |
| --- | --- |
| **Frontend Framework** | Next.js 14+ (App Router), React |
| **Styling** | Tailwind CSS, Shadcn UI |
| **Backend Framework** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **AI Driver** | Google Gemini SDK |
| **Deployment Cloud** | Vercel (Front), Render (API) |
| **Monorepo** | Turborepo |

---

## 🚀 Quick Setup & Installation Guide

### Prerequisites
- Node.js (v18.0.0+)
- pnpm (Recommended package manager)
- PostgreSQL Database URL (Get a free one at Neon.tech)
- Minimum: 1 Google Gemini API Key.

### Step 1: Clone the Repo
```bash
git clone https://github.com/your-repo/baosocial.git
cd baosocial
```

### Step 2: Install Packages
Install the required monorepo packages across both `apps` and `packages/db`.
```bash
pnpm install
```

### Step 3: Environment Configuration (.env)
Draft a `.env` file at the root. Replicate the baseline credentials required to connect:

```env
# Drizzle Connection
DATABASE_URL="postgres://user:password@hello-world.neon.tech/dbname?sslmode=require"

# API & Frontend Reference
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Auto-share Social Webhook (Make.com, Zapier) - Also configurable via Admin UI Dashboard
# SOCIAL_WEBHOOK_URL="https://hook.make.com/xxxxxx"
```

### Step 4: Bootstrap Database Schema
Seed your remote PostgreSQL database matching local models:
```bash
pnpm db:push
```

### Step 5: Start Dev Servers
Run concurrent localhost servers utilizing turbo pipeline streams:
```bash
pnpm dev
```
- Frontend Viewport: `http://localhost:3000`
- API Health Check: `http://localhost:3001`

---

## 🌍 How to Wire Make.com Autoposting (Social Webhook)
To automatically share articles online immediately after publishing processing finishes:
1. Initialize a workflow on [Make.com](https://make.com).
2. Start by placing a **Webhook -> Custom Webhook**, and copy to clipboard the generated listener URL piece.
3. Surf over to your initialized Local/Production Admin Dashboard -> Under `Settings`, create a master key titled exactly `social_webhook_url`. Insert the Make.com URL payload as the variable value.
4. Returning back to Make.com, link the aforementioned Webhook directly into a Facebook Page post component configuring string text utilizing the title and linked components mapped from the returned JSON JSON body parameters payload array.

---

> NOTE: This is a living document. Functionalities are systematically evolving concurrently with technological SEO thresholds. 
