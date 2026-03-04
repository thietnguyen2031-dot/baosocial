console.log("🚀 Starting API...");
import "./setup-env"; // Must be first
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { RSSCrawler } from "@packages/crawler";

const app = express();
const port = process.env.PORT || 3001;
const crawler = new RSSCrawler();

app.use(cors());
app.use(express.json());

// Initialize Telegram Bot
import { initTelegramBot } from "./services/telegram-bot";
initTelegramBot().catch(e => console.error("Failed to init Telegram Bot:", e));

import { sendToWebhook } from "./services/webhook";
import { uploadToImgBBDual } from "./services/imgbb";
import * as cheerio from "cheerio";

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/", (req, res) => {
  res.send("Backend is running (Admin Routes & Socket.io Available)!");
});



import { db, rssFeeds, articles } from "@packages/db";
import { eq, desc, count, isNull, asc, inArray, sql } from "drizzle-orm";

// DIAGNOSTIC ROUTE TO TEST IMGBB UPLOAD
app.get("/debug/imgbb", async (req, res) => {
  try {
    // Test with a real Baoquocte image to verify hotlink bypass
    const testUrl = req.query.url as string || "https://baoquocte.vn/stores/news_dataimages/2025/0809/img_653x490_1d1721a7979a6aeac7090bb8958d5c0e.jpg";
    const result = await uploadToImgBBDual(testUrl, true);

    res.json({
      success: true,
      hasKeysEnv: !!process.env.IMGBB_API_KEYS,
      inputUrl: testUrl,
      result: result,
      didUpload: result !== null && result.primaryUrl !== testUrl,
      envPreview: process.env.IMGBB_API_KEYS ? process.env.IMGBB_API_KEYS.substring(0, 20) + '...' : null
    });
  } catch (err: any) {
    res.json({ success: false, error: err.message, stack: err.stack });
  }
});



// BATCH IMAGE RE-MIGRATION: Re-upload old article images to ImgBB (no AI rerun needed)
app.post("/admin/remigrate-images", async (req, res) => {
  const { limit = 20, offset = 0 } = req.body;

  try {
    const batch = await db.select().from(articles)
      .where(eq(articles.status, 'PUBLISHED'))
      .limit(Number(limit))
      .offset(Number(offset));

    let processed = 0, updated = 0, skipped = 0;

    for (const article of batch) {
      processed++;
      const content = article.contentAi;
      if (!content) { skipped++; continue; }

      // Skip if already processed (has ImgBB links or data-backup attributes)
      if (content.includes('i.ibb.co') || content.includes('data-backup')) {
        skipped++;
        continue;
      }

      const $ = cheerio.load(content, null, false);
      const images = $('img').toArray();
      let changed = false;
      let newThumbnail = article.thumbnail;

      for (const img of images) {
        const src = $(img).attr('src');
        if (!src || src.includes('i.ibb.co')) continue;

        const uploadResult = await uploadToImgBBDual(src);
        if (uploadResult) {
          $(img).attr('src', uploadResult.primaryUrl);
          $(img).attr('data-backup', uploadResult.backupUrl);
          $(img).attr('data-original', uploadResult.originalUrl);
          $(img).attr('onerror', "this.onerror=null; this.src=this.getAttribute('data-backup') || this.getAttribute('data-original');");
          // Upgrade thumbnail if it matches current src
          if (!newThumbnail || newThumbnail === src) {
            newThumbnail = uploadResult.primaryUrl;
          }
          changed = true;
        }
      }

      if (changed) {
        await db.update(articles)
          .set({ contentAi: $.html(), thumbnail: newThumbnail })
          .where(eq(articles.id, article.id));
        updated++;
      }
    }

    res.json({
      success: true,
      processed,
      updated,
      skipped,
      nextOffset: Number(offset) + Number(limit),
      message: `Re-migrated ${updated}/${processed} articles. Run again with offset=${Number(offset) + Number(limit)} to continue.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADMIN STATS ENDPOINT
app.get("/admin/stats", async (req, res) => {
  try {
    const totalArticles = await db.select({ value: count() }).from(articles);
    const pendingArticles = await db.select({ value: count() }).from(articles).where(eq(articles.status, "PENDING"));
    const activeFeeds = await db.select({ value: count() }).from(rssFeeds).where(eq(rssFeeds.isActive, true));

    res.json({
      totalArticles: totalArticles[0].value,
      pendingArticles: pendingArticles[0].value,
      activeFeeds: activeFeeds[0].value,
      visitors: 12500 // Mock for now as we don't track analytics yet
    });
  } catch (error) {
    res.status(500).json({ error: "Stats error" });
  }
});

// (duplicate early GET/POST/DELETE /rss-feeds stubs removed — full handlers with crawlMinute are below)




// Helper: Simple Slugify
function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// ... existing RSS endpoints ...

// DELETE articles by category (for testing)
// DELETE articles by category (for testing)
app.delete("/articles/category/:category", async (req, res) => {
  try {
    await db.delete(articles).where(eq(articles.category, req.params.category));
    res.json({ success: true, message: `Deleted articles in category: ${req.params.category}` });
  } catch (error: any) {
    console.error("❌ [API] DELETE /articles Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// SYNC SERVICE: Fetch RSS and Save to DB
app.post("/sync-news", async (req, res) => {
  try {
    const activeFeeds = await db.query.rssFeeds.findMany({ where: (f, { eq }) => eq(f.isActive, true) });

    // Stats tracking
    let newCount = 0;
    let aiSuccessCount = 0;
    let aiFailCount = 0;
    const debugLogs: string[] = [];
    const log = (msg: string) => { console.log(msg); debugLogs.push(msg); };

    // Check Telegram Approval Mode
    const telegramSetting = await db.query.systemSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "telegram_approval_enabled")
    });
    const isTelegramApproval = telegramSetting?.value === "true";

    log(`[Sync] 🔧 Mode: ${isTelegramApproval ? 'Telegram Approval' : 'Auto-Publish'}`);
    log(`[Sync] Found ${activeFeeds.length} active feeds.`);

    for (const feed of activeFeeds) {
      log(`[Sync] Fetching feed: ${feed.url}`);
      const items = await crawler.fetchFeed(feed.url, feed.source);
      log(`[Sync] Feed fetched. Items: ${items.length}`);

      for (const item of items) {
        // Check if exists by Source URL (avoid duplicates)
        const existing = await db.query.articles.findFirst({
          where: (a, { eq }) => eq(a.sourceUrl, item.link)
        });

        if (existing) {
          log(`[Sync] ⏭️ Skipping duplicate: ${item.link}`);
          continue;
        }

        // Generate unique slug
        const baseSlug = slugify(item.title);
        const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        log(`[Sync] 🌐 Scraping content: ${item.link}`);

        // Fetch full content
        const { content: fullContent, title: scrapedTitle, description: scrapedDesc, thumbnail: scrapedThumbnail } = await crawler.fetchContent(item.link, {
          contentSelector: feed.contentSelector,
          excludeSelector: feed.excludeSelector,
          titleSelector: feed.titleSelector,
          descriptionSelector: feed.descriptionSelector
        });

        // Check Auto SEO Setting (Per Feed)
        const isAutoSeo = feed.autoSeo === true;

        let finalTitle = scrapedTitle || item.title || "Untitled";
        let finalDesc = scrapedDesc || item.contentSnippet || "";
        let finalContent = fullContent;
        let finalSeoTitle = "";
        let finalSeoDesc = "";
        let finalSlug = uniqueSlug;
        let aiSuccess = false;

        if (isAutoSeo && fullContent && fullContent.length > 200) {
          try {
            // Fetch API Keys
            const keySetting = await db.query.systemSettings.findFirst({ where: (s, { eq }) => eq(s.key, "gemini_api_keys") });
            let keys: string[] = [];
            if (keySetting && keySetting.value) {
              keys = keySetting.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k);
            }

            if (keys.length > 0) {
              log(`[Sync] 🤖 Running Auto SEO for: ${finalTitle.substring(0, 50)}...`);
              // CRITICAL DEBUG: Log the keys before passing to AI
              log(`[Sync] 🔑 DEBUG: Fetched ${keys.length} keys from database`);
              keys.forEach((k, idx) => {
                log(`[Sync] 🔑 Key ${idx + 1}: ...${k.slice(-8)} (length: ${k.length})`);
              });
              const { generateSEOSuggestions } = await import("@packages/ai");
              const seoData = await generateSEOSuggestions(finalTitle, fullContent, keys, item.link);

              finalTitle = seoData.suggestedTitle;
              finalDesc = seoData.metaDescription;
              finalContent = seoData.rewrittenContent;
              finalSlug = seoData.slug;
              finalSeoTitle = seoData.suggestedTitle;
              finalSeoDesc = seoData.metaDescription;
              aiSuccess = true;
              aiSuccessCount++;
              log(`[Sync] ✅ AI Rewrite SUCCESS`);
            } else {
              log(`[Sync] ⚠️ No API keys configured`);
              aiFailCount++;
            }
          } catch (err) {
            log(`[Sync] ❌ AI Rewrite FAILED: ${err}`);
            aiFailCount++;
          }
        }

        // Determine status based on Telegram Approval Mode
        let articleStatus = "PENDING";
        if (!isTelegramApproval) {
          // Auto-publish mode: Only publish if AI rewrite was successful
          articleStatus = aiSuccess ? "PUBLISHED" : "PENDING";
        }
        // If Telegram mode is ON, everything stays PENDING

        // --- ImgBB Dual Account Image Processing ---
        let finalThumbnail = item.thumbnail || scrapedThumbnail || null;

        if (finalContent) {
          const $ = cheerio.load(finalContent, null, false);
          const images = $('img').toArray();

          for (const img of images) {
            const src = $(img).attr('src');
            if (src) {
              const uploadResult = await uploadToImgBBDual(src);
              if (uploadResult) {
                $(img).attr('src', uploadResult.primaryUrl);
                $(img).attr('data-backup', uploadResult.backupUrl);
                $(img).attr('data-original', uploadResult.originalUrl);
                $(img).attr('onerror', "this.onerror=null; this.src=this.getAttribute('data-backup') || this.getAttribute('data-original');");

                // If we haven't locked in a valid thumbnail yet, use the first successful uploaded image
                if (!finalThumbnail || finalThumbnail === src || finalThumbnail === item.thumbnail) {
                  finalThumbnail = uploadResult.primaryUrl;
                }
              }
            }
          }
          finalContent = $.html();
        }

        // Fallback thumbnail extraction from the final content if everything else failed
        if (!finalThumbnail && finalContent) {
          const match = finalContent.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
          if (match) {
            finalThumbnail = match[1];
            log(`[Sync] 🖼️ Fallback thumbnail from content: ${finalThumbnail.substring(0, 50)}...`);
          }
        }

        const [insertedArticle] = await db.insert(articles).values({
          title: finalTitle,
          slug: finalSlug,
          summary: finalDesc,
          contentAi: finalContent,
          seoTitle: finalSeoTitle,
          seoDescription: finalSeoDesc,
          thumbnail: finalThumbnail,
          sourceUrl: item.link,
          category: feed.category,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          status: articleStatus,
        }).returning();

        if (articleStatus === 'PUBLISHED' && insertedArticle) {
          sendToWebhook(insertedArticle).catch(() => { });
        }

        newCount++;
        log(`[Sync] 💾 Saved: ${finalTitle.substring(0, 50)}... [${articleStatus}]`);
      }
    }

    // Final summary
    log(`\n📊 ========== SYNC COMPLETE ==========`);
    log(`📰 Total new articles: ${newCount}`);
    if (aiSuccessCount > 0 || aiFailCount > 0) {
      log(`✅ AI Success: ${aiSuccessCount}`);
      log(`❌ AI Failed: ${aiFailCount}`);
    }
    log(`🔧 Mode: ${isTelegramApproval ? 'Telegram Approval (All PENDING)' : 'Auto-Publish (Success→PUBLISHED, Fail→PENDING)'}`);
    log(`=====================================`);

    res.json({
      success: true,
      message: `Synced ${newCount} new articles.`,
      debugLogs,
      stats: {
        total: newCount,
        aiSuccess: aiSuccessCount,
        aiFail: aiFailCount,
        mode: isTelegramApproval ? 'telegram' : 'auto'
      }
    });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Failed to sync news" });
  }
});


// AI QUOTA STATUS ENDPOINT
app.get("/ai/quota-status", async (req, res) => {
  try {
    const keySetting = await db.query.systemSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "gemini_api_keys")
    });

    let keys: string[] = [];
    if (keySetting?.value) {
      keys = keySetting.value.split(/[\n,]+/).map((k: string) => k.trim()).filter((k: string) => k);
    }

    const { getQuotaStatus, ARTICLES_PER_MODEL_PER_DAY } = await import("@packages/ai");
    const quotaData = getQuotaStatus(keys);

    const totalKeys = keys.length;
    const totalRemaining = quotaData.reduce((sum: number, k: any) => sum + k.articlesRemaining, 0);
    const totalCapacity = totalKeys * ARTICLES_PER_MODEL_PER_DAY * 2;
    const nextReset = quotaData[0]?.nextResetAt ?? null;

    res.json({
      totalKeys,
      totalRemaining,
      totalCapacity,
      nextResetAt: nextReset,
      keys: quotaData
    });
  } catch (error) {
    console.error("Quota Status Error:", error);
    res.status(500).json({ error: "Failed to get quota status" });
  }
});

// CRAWLER ENDPOINTS

// GET /crawler/preview - Proxy to fetch raw HTML for visual selector
app.get("/crawler/preview", async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "Missing URL" });
    }

    // validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    console.log(`Proxy fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });
    }

    const html = await response.text();

    // Inject <base> tag so relative links work
    const baseUrl = new URL(url).origin;
    const injectedHtml = html.replace('<head>', `<head><base href="${baseUrl}/" />`);

    res.setHeader('Content-Type', 'text/html');
    res.send(injectedHtml);
  } catch (error) {
    console.error("Preview Error:", error);
    res.status(500).json({ error: "Failed to fetch preview" });
  }
});

// GET /crawler/feed-preview - Parse RSS to get sample links
app.get("/crawler/feed-preview", async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // Reuse crawler package to fetch feed
    const items = await crawler.fetchFeed(url, "");

    // Return top 5 items for selection
    res.json(items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      date: item.pubDate
    })));
  } catch (error) {
    console.error("Feed Preview Error:", error);
    res.status(500).json({ error: "Failed to parse feed" });
  }
});


// ARTICLE MANAGEMENT ENDPOINTS

// GET /articles - List with filters
app.get("/articles", async (req, res) => {
  try {
    const statusQuery = req.query.status as string;

    // Sort by updatedAt so newly approved articles appear first
    const allArticles = await db.select().from(articles).orderBy(desc(articles.updatedAt));

    let filtered;
    if (statusQuery === 'all') {
      filtered = allArticles;
    } else if (statusQuery) {
      filtered = allArticles.filter(a => a.status === statusQuery);
    } else {
      // Default: PUBLISHED or legacy null-status articles
      filtered = allArticles.filter(a => a.status === 'PUBLISHED' || a.status === null);
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// GET /articles/:id
app.get("/articles/:id", async (req, res) => {
  try {
    const article = await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.id, Number(req.params.id))
    });
    if (!article) return res.status(404).json({ error: "Not found" });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: "Fetch error" });
  }
});

// PATCH /articles/:id
app.patch("/articles/:id", async (req, res) => {
  try {
    const { title, slug, summary, contentAi, status, seoTitle, seoDescription, focusKeyword, thumbnail } = req.body;

    // Build the set object with only defined fields
    const updateSet: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) updateSet.title = title;
    if (slug !== undefined) updateSet.slug = slug;
    if (summary !== undefined) updateSet.summary = summary;
    if (contentAi !== undefined) updateSet.contentAi = contentAi;
    if (status !== undefined) updateSet.status = status;
    if (seoTitle !== undefined) updateSet.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateSet.seoDescription = seoDescription;
    if (focusKeyword !== undefined) updateSet.focusKeyword = focusKeyword;
    if (thumbnail !== undefined) updateSet.thumbnail = thumbnail;

    const oldArticle = await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.id, Number(req.params.id))
    });

    await db.update(articles)
      .set(updateSet)
      .where(eq(articles.id, Number(req.params.id)));

    if (oldArticle && oldArticle.status !== 'PUBLISHED' && status === 'PUBLISHED') {
      const publishedArticle = { ...oldArticle, ...updateSet };
      sendToWebhook(publishedArticle).catch(() => { });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Update error" });
  }
});

// DELETE /articles/:id
app.delete("/articles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`[API] Deleting article ID: ${id}`);

    // Delete related data first (Manual Cascade)
    await db.delete(favorites).where(eq(favorites.articleId, id));
    await db.delete(comments).where(eq(comments.articleId, id));

    // Delete article
    const deleted = await db.delete(articles).where(eq(articles.id, id)).returning();
    console.log(`[API] Deleted count: ${deleted.length}`);

    if (deleted.length === 0) {
      console.log(`[API] Article ID ${id} not found or not deleted.`);
      // We still return success: true to prompt UI to refresh, but maybe we should warn?
      // Actually if it's already gone, it's success.
    }

    res.json({ success: true, deleted: deleted.length });
  } catch (error) {
    console.error("Delete article error:", error);
    res.status(500).json({ error: "Delete error" });
  }
});

// GET /news (For Frontend)
app.get("/news", async (req, res) => {
  try {
    // 1. Try fetching PUBLISHED articles from DB first
    const published = await db.query.articles.findMany({
      where: (a, { eq }) => eq(a.status, "PUBLISHED"),
      orderBy: desc(articles.publishedAt),
      limit: 50
    });

    // 2. Return data (empty if none)
    // Removed Live Crawl Fallback to enforce 'PENDING' -> 'PUBLISHED' workflow

    if (published.length > 0) {
      const mapped = published.map(a => ({
        id: a.id,            // Use 'id' directly for clarity
        guid: a.id,
        title: a.title,
        link: a.sourceUrl,   // Keep sourceUrl for reference if needed
        pubDate: a.publishedAt,
        contentSnippet: a.summary,
        category: a.category,
        slug: a.slug,
        content: a.contentAi,
        source: 'BaoSocial',
        thumbnail: a.thumbnail || ''
      }));
      return res.json({ success: true, count: mapped.length, data: mapped });
    }

    // No published articles found
    res.json({ success: true, count: 0, data: [] });

  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ success: false, error: "Failed to fetch news" });
  }
});

// AI REWRITE ENDPOINT
import { rewriteContent } from "@packages/ai";

app.post("/ai/rewrite", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Missing content" });

  try {
    // Fetch API Keys from DB
    const keySetting = await db.query.systemSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "gemini_api_keys")
    });

    console.log(`🔍 [DEBUG] Raw DB value:`, keySetting?.value);

    let keys: string[] = [];
    if (keySetting && keySetting.value) {
      // Split by newline or comma
      keys = keySetting.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k);
    }

    console.log(`🔍 [DEBUG] Parsed ${keys.length} keys:`, keys.map(k => `...${k.slice(-8)}`));

    if (keys.length === 0) {
      return res.status(400).json({ error: "Vui lòng cấu hình Gemini API Key trong phần Cài đặt (Settings)." });
    }

    console.log(`✍️ [AI] Rewriting content with ${keys.length} keys...`);
    const rewritten = await rewriteContent(content, keys);
    res.json({ content: rewritten });
  } catch (error: any) {
    console.error("❌ [AI] Error:", error.message);
    if (error.message.includes("API keys")) {
      return res.status(400).json({ error: "API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình." });
    }
    res.status(500).json({ error: "Lỗi AI: " + error.message });
  }
});

// AI SEO SUGGESTIONS ENDPOINT
app.post("/ai/seo-suggestions", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Missing title or content" });
  }

  try {
    // Fetch API Keys from DB
    const keySetting = await db.query.systemSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "gemini_api_keys")
    });

    let keys: string[] = [];
    if (keySetting && keySetting.value) {
      keys = keySetting.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k);
    }

    console.log(`🎯 [AI SEO] Generating suggestions with ${keys.length} keys...`);

    if (keys.length === 0) {
      return res.status(400).json({ error: "Vui lòng cấu hình Gemini API Key trong phần Cài đặt (Settings)." });
    }

    const { generateSEOSuggestions } = await import("@packages/ai");
    const suggestions = await generateSEOSuggestions(title, content, keys);

    res.json(suggestions);
  } catch (error: any) {
    console.error("❌ [AI SEO] Error:", error.message);
    res.status(500).json({ error: "Lỗi AI SEO: " + error.message });
  }
});

// BACKGROUND SEO JOBS MAP
const seoJobs = new Map<string, {
  status: 'running' | 'stopped' | 'done',
  logs: string[],
  total: number,
  done: number,
  success: number,
  fail: number
}>();

import { randomUUID } from "crypto";

// GET JOB STATUS
app.get("/ai/seo-job/:id", (req, res) => {
  const job = seoJobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// STOP JOB
app.post("/ai/seo-stop/:id", (req, res) => {
  const job = seoJobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status === 'running') {
    job.status = 'stopped';
    job.logs.push(`🛑 Đã nhận yêu cầu dừng bắt buộc từ người dùng.`);
    res.json({ success: true, message: "Job stopped" });
  } else {
    res.json({ success: false, message: "Job is not running" });
  }
});

// BULK AUTO SEO ENDPOINT
app.post("/ai/bulk-seo", async (req, res) => {
  const { articleIds } = req.body;
  if (!Array.isArray(articleIds) || articleIds.length === 0) {
    return res.status(400).json({ error: "Missing or invalid articleIds" });
  }

  try {
    // 1. Fetch Setting: Telegram Approval Mode (determines auto-publish)
    const telegramSetting = await db.query.systemSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "telegram_approval_enabled")
    });
    const isTelegramApproval = telegramSetting?.value === "true";

    // 2. Fetch API Keys
    const keySetting = await db.query.systemSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "gemini_api_keys")
    });
    let keys: string[] = [];
    if (keySetting && keySetting.value) {
      keys = keySetting.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k);
    }
    if (keys.length === 0) {
      return res.status(400).json({ error: "Vui lòng cấu hình Gemini API Key trước khi dùng Auto SEO." });
    }

    const jobId = randomUUID();
    seoJobs.set(jobId, {
      status: 'running',
      logs: [`🚀 Khởi tạo Job ID: ${jobId}`, `🔄 Đang chuẩn bị chạy Auto SEO cho ${articleIds.length} bài viết...`],
      total: articleIds.length,
      done: 0,
      success: 0,
      fail: 0
    });

    // Run in background immediately
    res.json({ success: true, jobId, message: "Bắt đầu chạy nền." });

    // Background process
    (async () => {
      const job = seoJobs.get(jobId)!;
      try {
        const { generateSEOSuggestions } = await import("@packages/ai");

        // Process sequentially
        for (const id of articleIds) {
          if (job.status === 'stopped') {
            job.logs.push(`🛑 Quá trình đã bị người dùng dừng lại.`);
            break;
          }

          const article = await db.query.articles.findFirst({
            where: (a, { eq }) => eq(a.id, Number(id))
          });

          if (!article) {
            job.logs.push(`⚠️ ID ${id}: Không tìm thấy bài viết.`);
            job.fail++;
            job.done++;
            continue;
          }

          if (article.status === 'PUBLISHED') {
            job.logs.push(`⏭️ ID ${id}: Đã xuất bản, bỏ qua.`);
            job.fail++;
            job.done++;
            continue;
          }

          const rawContent = article.contentAi || "";
          if (rawContent.length < 50) {
            job.logs.push(`⚠️ ID ${id}: Bài viết quá ngắn, bỏ qua.`);
            job.fail++;
            job.done++;
            continue;
          }

          try {
            job.logs.push(`🔄 Đang xử lý: ${article.title.substring(0, 40)}...`);
            const seoData = await generateSEOSuggestions(article.title, rawContent, keys, article.sourceUrl);

            // --- ImgBB Dual Account Image Processing ---
            let finalContent = seoData.rewrittenContent;
            let finalThumbnail = article.thumbnail;

            if (finalContent) {
              const $ = cheerio.load(finalContent, null, false);
              const images = $('img').toArray();

              for (const img of images) {
                const src = $(img).attr('src');
                if (src) {
                  // Run Parallel Upload
                  const uploadResult = await uploadToImgBBDual(src);

                  if (uploadResult) {
                    // Inject Dual-Backup Self-Healing DOM
                    $(img).attr('src', uploadResult.primaryUrl);
                    $(img).attr('data-backup', uploadResult.backupUrl);
                    $(img).attr('data-original', uploadResult.originalUrl);
                    $(img).attr('onerror', "this.onerror=null; this.src=this.getAttribute('data-backup') || this.getAttribute('data-original');");

                    // Set article thumbnail to the primary ImgBB link
                    finalThumbnail = uploadResult.primaryUrl;
                  }
                }
              }
              finalContent = $.html();
            }

            // Auto Publish Logic
            const newStatus = isTelegramApproval ? 'PENDING' : 'PUBLISHED';

            const [updatedArticle] = await db.update(articles)
              .set({
                title: seoData.suggestedTitle,
                slug: seoData.slug,
                summary: seoData.metaDescription,
                contentAi: finalContent,
                seoTitle: seoData.suggestedTitle,
                seoDescription: seoData.metaDescription,
                thumbnail: finalThumbnail,
                status: newStatus
              })
              .where(eq(articles.id, article.id))
              .returning();

            if (newStatus === 'PUBLISHED' && updatedArticle) {
              sendToWebhook(updatedArticle).catch(() => { });
            }

            job.logs.push(`✅ Thành công: ${seoData.suggestedTitle.substring(0, 40)}...`);
            job.success++;
          } catch (err: any) {
            job.logs.push(`❌ Lỗi bài ${id}: ${err.message}`);
            job.fail++;
          }
          job.done++;
        }

        if (job.status !== 'stopped') {
          job.status = 'done';
          job.logs.push(`🏁 Đã hoàn thành toàn bộ. Thành công: ${job.success}, Thất bại: ${job.fail}`);
        }
      } catch (fatalErr: any) {
        job.status = 'done';
        job.logs.push(`❌ Lỗi Job: ${fatalErr.message}`);
      }
    })();

  } catch (error: any) {
    console.error("❌ [AI Bulk SEO] Error:", error.message);
    res.status(500).json({ error: "Lỗi Bulk SEO: " + error.message });
  }
});
// COMMENTS ENDPOINTS
import { comments, users } from "@packages/db";

// GET Comments for an Article
app.get("/comments", async (req, res) => {
  try {
    const articleId = Number(req.query.articleId);
    if (!articleId) return res.status(400).json({ error: "Missing articleId" });

    const result = await db.select({
      id: comments.id,
      content: comments.content,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        name: users.name,
        avatar: users.avatar
      }
    })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.articleId, articleId))
      .orderBy(desc(comments.createdAt));

    res.json(result);
  } catch (error) {
    console.error("Get Comments Error:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST Comment
app.post("/comments", async (req, res) => {
  try {
    const { userId, articleId, content, parentId } = req.body;
    if (!userId || !articleId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const newComment = await db.insert(comments).values({
      userId,
      articleId,
      content,
      parentId: parentId || null
    }).returning();

    res.json(newComment[0]);
  } catch (error) {
    console.error("Post Comment Error:", error);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// FAVORITES ENDPOINTS
import { favorites } from "@packages/db";
import { and } from "drizzle-orm";

// GET User Favorites
app.get("/favorites", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await db.select({
      id: favorites.id,
      articleId: favorites.articleId,
      createdAt: favorites.createdAt,
      article: {
        title: articles.title,
        slug: articles.slug,
        thumbnail: articles.thumbnail,
        summary: articles.summary
      }
    })
      .from(favorites)
      .leftJoin(articles, eq(favorites.articleId, articles.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    res.json(result);
  } catch (error) {
    console.error("Get Favorites Error:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// CHECK if article is favorited
app.get("/favorites/check", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    const articleId = Number(req.query.articleId);
    if (!userId || !articleId) return res.status(400).json({ error: "Missing fields" });

    const existing = await db.query.favorites.findFirst({
      where: (f, { eq, and }) => and(eq(f.userId, userId), eq(f.articleId, articleId))
    });

    res.json({ isFavorited: !!existing });
  } catch (error) {
    res.status(500).json({ error: "Check failed" });
  }
});

// POST Toggle Favorite (Save/Unsave logic can be here or separate)
// Let's do explicit Save and Delete
app.post("/favorites", async (req, res) => {
  try {
    const { userId, articleId } = req.body;
    if (!userId || !articleId) return res.status(400).json({ error: "Missing fields" });

    // Check duplicate
    const existing = await db.query.favorites.findFirst({
      where: (f, { eq, and }) => and(eq(f.userId, userId), eq(f.articleId, articleId))
    });

    if (existing) return res.status(400).json({ error: "Already saved" });

    await db.insert(favorites).values({ userId, articleId });
    res.json({ success: true });
  } catch (error) {
    console.error("Save Favorite Error:", error);
    res.status(500).json({ error: "Failed to save" });
  }
});

// DELETE Favorite
app.delete("/favorites", async (req, res) => {
  try {
    const { userId, articleId } = req.body;
    if (!userId || !articleId) return res.status(400).json({ error: "Missing fields" });

    await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.articleId, articleId)));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove" });
  }
});

// SYSTEM SETTINGS ENDPOINTS
import { systemSettings } from "@packages/db";

// CATEGORY MANAGEMENT ENDPOINTS (Before Settings)
import { categories } from "@packages/db";

app.get("/categories", async (req, res) => {
  try {
    const isHeaderOnly = req.query.header === 'true';
    let query = db.select().from(categories);

    if (isHeaderOnly) {
      query = query.where(eq(categories.showOnHeader, true)) as any;
    }

    const list = await query.orderBy(asc(categories.listOrder), desc(categories.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/categories", async (req, res) => {
  try {
    const { name, slug, description, showOnHeader } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "Name and Slug are required" });

    const newCat = await db.insert(categories).values({
      name,
      slug: slugify(slug), // Ensure slug format
      description,
      showOnHeader: !!showOnHeader
    }).returning();
    res.json(newCat[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create category" });
  }
});

app.post("/categories/reorder", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: "Invalid payload format" });

    await Promise.all(
      items.map(async (item: any) => {
        if (item.id !== undefined && item.listOrder !== undefined) {
          await db.update(categories)
            .set({ listOrder: item.listOrder })
            .where(eq(categories.id, item.id));
        }
      })
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to reorder categories" });
  }
});

app.patch("/categories/:id", async (req, res) => {
  try {
    const { showOnHeader } = req.body;
    await db.update(categories)
      .set({ showOnHeader })
      .where(eq(categories.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

app.delete("/categories/:id", async (req, res) => {
  try {
    await db.delete(categories).where(eq(categories.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

app.get("/settings", async (req, res) => {
  try {
    const settings = await db.select().from(systemSettings);
    // Convert array to object { key: value } for easier FE consumption? 
    // Or return array. Let's return array for now to keep it simple with metadata.
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.post("/settings", async (req, res) => {
  try {
    const { key, value, description } = req.body;
    if (!key) return res.status(400).json({ error: "Key is required" });

    // Upsert logic
    const existing = await db.query.systemSettings.findFirst({
      where: (s, { eq }) => eq(s.key, key)
    });

    if (existing) {
      await db.update(systemSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({ key, value, description });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Settings Error:", error);
    res.status(500).json({ error: "Failed to save setting" });
  }
});

// RSS FEEDS CONFIG ENDPOINTS
app.get("/rss-feeds", async (req, res) => {
  try {
    const list = await db.select({
      id: rssFeeds.id,
      url: rssFeeds.url,
      source: rssFeeds.source,
      category: rssFeeds.category,
      contentSelector: rssFeeds.contentSelector,
      excludeSelector: rssFeeds.excludeSelector,
      titleSelector: rssFeeds.titleSelector,
      descriptionSelector: rssFeeds.descriptionSelector,
      autoSeo: rssFeeds.autoSeo,
      isActive: rssFeeds.isActive,
      createdAt: rssFeeds.createdAt,
      crawlMinute: sql`crawl_minute`.mapWith(Number)
    }).from(rssFeeds).orderBy(desc(rssFeeds.createdAt));
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch feeds" });
  }
});

app.post("/rss-feeds", async (req, res) => {
  try {
    const { url, source, category, contentSelector, excludeSelector, titleSelector, descriptionSelector, autoSeo, crawlMinute } = req.body;

    console.log(`[DEBUG POST FEED] received`);
    console.log(`  - Raw payload crawlMinute:`, crawlMinute);

    const parsedMinute = crawlMinute !== undefined ? parseInt(String(crawlMinute)) : 0;

    const insertData = {
      url, source, category,
      contentSelector, excludeSelector,
      titleSelector, descriptionSelector,
      autoSeo: !!autoSeo,
    };
    console.log(`  - Insert Object keys:`, Object.keys(insertData));

    // 1. Insert known schema fields
    const newFeed = await db.insert(rssFeeds).values(insertData).returning();
    const insertedId = newFeed[0].id;

    // 2. Force set crawl_minute via SQL to bypass schema mapping cache error
    const rawQuery = `UPDATE rss_feeds SET crawl_minute = ${parsedMinute} WHERE id = ${insertedId}`;
    await db.execute(sql.raw(rawQuery));

    // Attach to response
    newFeed[0].crawlMinute = parsedMinute;

    console.log(`  - DB Result:`, newFeed);

    setupPerFeedCrons(); // Re-schedule after adding feed
    res.json(newFeed[0]);
  } catch (error: any) {
    console.error(`[DEBUG POST FEED ERROR]`, error);
    res.status(500).json({ error: error.message || "Failed to create feed" });
  }
});

app.put("/rss-feeds/:id", async (req, res) => {
  try {
    const { url, source, category, contentSelector, excludeSelector, titleSelector, descriptionSelector, autoSeo, crawlMinute } = req.body;

    console.log(`[DEBUG PUT FEED] ID: ${req.params.id}`);
    console.log(`  - Raw payload crawlMinute:`, crawlMinute);

    const parsedMinute = crawlMinute !== undefined ? parseInt(String(crawlMinute)) : 0;
    console.log(`  - Parsed crawlMinute:`, parsedMinute);

    const updateData = {
      url, source, category,
      contentSelector, excludeSelector,
      titleSelector, descriptionSelector,
      autoSeo: !!autoSeo,
      crawlMinute: parsedMinute,
    };

    console.log(`  - Update Object keys:`, Object.keys(updateData), '| crawlMinute:', parsedMinute);

    const result = await db.update(rssFeeds)
      .set(updateData)
      .where(eq(rssFeeds.id, Number(req.params.id)))
      .returning();

    console.log(`  - DB Result crawlMinute:`, result[0]?.crawlMinute);

    setupPerFeedCrons(); // Re-schedule after updating feed
    res.json({ success: true, updated: result });
  } catch (error) {
    console.error(`[DEBUG PUT FEED ERROR]`, error);
    res.status(500).json({ error: "Failed to update feed" });
  }
});

app.delete("/rss-feeds/:id", async (req, res) => {
  try {
    await db.delete(rssFeeds).where(eq(rssFeeds.id, Number(req.params.id)));
    setupPerFeedCrons(); // Re-schedule after deleting feed
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete feed" });
  }
});

// TOGGLE FEED
app.patch("/rss-feeds/:id/toggle", async (req, res) => {
  try {
    const { isActive } = req.body;
    await db.update(rssFeeds)
      .set({ isActive })
      .where(eq(rssFeeds.id, Number(req.params.id)));
    setupPerFeedCrons(); // Re-schedule after toggling
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle feed" });
  }
});

// BULK TOGGLE FEEDS
app.post("/rss-feeds/bulk-toggle", async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Missing or invalid ids" });
    }

    await db.update(rssFeeds)
      .set({ isActive })
      .where(inArray(rssFeeds.id, ids));

    setupPerFeedCrons(); // Re-schedule after bulk toggle
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to bulk toggle feeds" });
  }
});

// USER MANAGEMENT
app.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { role, status } = req.body;
    const userId = Number(req.params.id);

    if (!userId) return res.status(400).json({ error: "Invalid ID" });

    await db.update(users)
      .set({ role, status })
      .where(eq(users.id, userId));

    res.json({ success: true });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// GET Article by Slug (for SEO URLs /tin/{slug})
app.get("/articles/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    let article = await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.slug, slug)
    });

    // Fallback if not found by slug but is a valid ID
    if (!article && !isNaN(Number(slug))) {
      article = await db.query.articles.findFirst({
        where: (a, { eq }) => eq(a.id, Number(slug))
      });
    }

    if (!article) return res.status(404).json({ error: "Article not found" });

    // --- INTERNAL LINK DICTIONARY SYSTEM ---
    if (article.contentAi) {
      // Fetch up to 50 latest published articles to build the keyword dictionary
      // Uses focusKeyword if set, otherwise falls back to the first meaningful words in the title
      const recentArticles = await db.query.articles.findMany({
        where: (a, { eq, and, ne, isNotNull }) => and(
          eq(a.status, "PUBLISHED"),
          isNotNull(a.title),
          ne(a.id, article!.id)
        ),
        orderBy: desc(articles.publishedAt),
        columns: {
          slug: true,
          focusKeyword: true,
          title: true,
        },
        limit: 50
      });

      // Build keyword dictionary: prefer focusKeyword, fall back to extracting from title
      const linkDict = recentArticles
        .map(a => {
          const keyword = a.focusKeyword?.trim() ||
            // Extract 2-4 most meaningful words from title (skip articles/prepositions)
            a.title?.split(' ').filter(w => w.length > 3).slice(0, 3).join(' ');
          return keyword ? { keyword, slug: a.slug } : null;
        })
        .filter((k): k is { keyword: string; slug: string } => !!k && !!k.slug);

      if (linkDict.length > 0) {
        const $ = cheerio.load(article.contentAi, null, false);

        linkDict.forEach(({ keyword, slug }) => {
          const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // For multi-word phrases, use plain match; for single words use word boundary
          const isSingleWord = !keyword.includes(' ');
          const pattern = isSingleWord
            ? `\\b(${escapeRegExp(keyword)})\\b`
            : `(${escapeRegExp(keyword)})`;
          const keywordRegex = new RegExp(pattern, 'i');
          let found = false;

          $('p, li').each((_, el) => {
            if (found) return;
            if ($(el).parents('a').length > 0) return; // Don't nest inside existing links

            const html = $(el).html();
            if (html && keywordRegex.test(html) && !html.includes(`href="/tin/${slug}"`)) {
              const newHtml = html.replace(
                keywordRegex,
                `<a href="/tin/${slug}" title="$1" class="text-blue-600 hover:underline font-medium">$1</a>`
              );
              if (newHtml !== html) {
                $(el).html(newHtml);
                found = true;
              }
            }
          });
        });

        article.contentAi = $.html();
      }
    }

    res.json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ADMIN UTILITY: Fix legacy articles with null status
app.post("/settings/fix-legacy-status", async (req, res) => {
  try {
    const result = await db.update(articles)
      .set({ status: "PUBLISHED" })
      .where(isNull(articles.status));

    res.json({ success: true, message: "Updated legacy articles to 'PUBLISHED'" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


// FORCE UPDATE ALL SLUGS (Admin utility endpoint)
app.post("/force-update-slugs", async (req, res) => {
  try {
    const { generateSlug } = await import("@packages/db/src/utils");

    const allArticles = await db.select().from(articles);
    console.log(`🔄 Force updating slugs for ${allArticles.length} articles...`);

    const existingSlugs: string[] = [];
    let updated = 0;

    for (const article of allArticles) {
      // Logic from backfill script
      let baseSlug = generateSlug(article.title);
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (existingSlugs.includes(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      await db.update(articles)
        .set({ slug: uniqueSlug })
        .where(eq(articles.id, article.id));

      existingSlugs.push(uniqueSlug);
      updated++;
    }

    res.json({ success: true, updated, total: allArticles.length });
  } catch (error: any) {
    console.error("Force update slugs error:", error);
    res.status(500).json({ error: error.message });
  }
});



// PER-FEED CRON JOBS (minute-based scheduling)
const feedCronJobs = new Map<number, any>();

export async function setupPerFeedCrons() {
  // Stop and clear all existing jobs
  feedCronJobs.forEach(job => job.stop());
  feedCronJobs.clear();

  try {
    const feeds = await db.select().from(rssFeeds).where(eq(rssFeeds.isActive, true));

    if (feeds.length === 0) {
      console.log("⏰ [Cron] No active feeds to schedule.");
      return;
    }

    for (const feed of feeds) {
      const minute = feed.crawlMinute ?? 0;
      const safeMinute = (isNaN(minute) || minute < 0 || minute > 59) ? 0 : minute;

      const job = cron.schedule(`${safeMinute} * * * *`, async () => {
        console.log(`⏰ [Cron] Auto-crawl: "${feed.source}" (at :**${String(safeMinute).padStart(2, '0')} every hour)`);
        try {
          const { syncSingleFeed } = await import("./services/sync-service");
          const count = await syncSingleFeed(feed.id);
          console.log(`✅ [Cron] Feed "${feed.source}" synced ${count} new articles.`);
        } catch (error) {
          console.error(`❌ [Cron] Feed "${feed.source}" sync failed:`, error);
        }
      });

      feedCronJobs.set(feed.id, job);
      console.log(`⏰ [Cron] Scheduled "${feed.source}" at minute :${String(safeMinute).padStart(2, '0')} every hour`);
    }

    console.log(`⏰ [Cron] ${feeds.length} feed(s) scheduled.`);
  } catch (err) {
    console.error("❌ [Cron] Failed to setup per-feed crons:", err);
  }
}

// Initialize on startup
setupPerFeedCrons();

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`⏰ Per-feed cron scheduling initialized.`);
});

