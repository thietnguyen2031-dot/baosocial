import { db, rssFeeds, articles } from "@packages/db";
import { eq } from "drizzle-orm";

// Sync a single feed by its record (internal helper)
async function syncFeed(feed: typeof rssFeeds.$inferSelect) {
    console.log(`📡 [SyncService] Fetching feed: ${feed.source}`);
    try {
        const crawler = await import("@packages/crawler");
        const items = await crawler.fetchFeed(feed.url);

        // Pre-fetch existing sourceUrls to avoid N+1 DB queries per article
        const { sql } = await import("drizzle-orm");
        const existingRows = await db.execute(sql.raw(
            `SELECT source_url FROM articles WHERE source_url IS NOT NULL`
        )) as any[];
        const existingUrls = new Set(existingRows.map((r: any) => r.source_url));

        let totalNew = 0;

        for (const item of items) {
            if (!item.link) continue;

            // 1. Time filter (skip if older than 3 days)
            const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            if (pubDate < threeDaysAgo) {
                console.log(`⏩ [SyncService] Skipping old article: ${item.title?.substring(0, 40)}`);
                continue;
            }

            // 2. Duplicate check by sourceUrl (exact match)
            const normalizedLink = item.link.replace(/\/$/, "").split("?")[0]; // strip trailing slash & query params
            if (existingUrls.has(item.link) || existingUrls.has(normalizedLink)) {
                console.log(`⏩ [SyncService] Skipping duplicate URL: ${item.title?.substring(0, 40)}`);
                continue;
            }

            // New article — add to local set immediately to prevent duplicates within same batch
            existingUrls.add(item.link);
            existingUrls.add(normalizedLink);

            // 3. Fetch full content
            const baseSlug = item.title ? slugifyStr(item.title) : "untitled";
            const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

            const contentResult = await crawler.fetchContent(item.link, {
                contentSelector: feed.contentSelector,
                excludeSelector: feed.excludeSelector,
                titleSelector: feed.titleSelector,
                descriptionSelector: feed.descriptionSelector
            }) as { content: string; title?: string; description?: string; thumbnail?: string };

            const { content: fullContent, title: scrapedTitle, description: scrapedDesc, thumbnail: scrapedThumbnail } = contentResult;

            // 4. Thumbnail: RSS image → scraped OG image → null
            const itemThumb = (item as any).thumbnail;
            const finalThumbnail = (itemThumb && itemThumb.trim() !== '')
                ? itemThumb
                : (scrapedThumbnail && scrapedThumbnail.trim() !== '')
                    ? scrapedThumbnail
                    : null;

            const newArticle = await db.insert(articles).values({
                title: scrapedTitle || item.title || "Untitled",
                slug: uniqueSlug,
                summary: scrapedDesc || (item as any).contentSnippet || "",
                contentAi: fullContent,
                thumbnail: finalThumbnail,
                sourceUrl: item.link,
                category: feed.category,
                publishedAt: pubDate,
                status: "PENDING"
            }).returning();

            if (newArticle[0]) {
                const { processNewArticle } = await import("./ai-pipeline");
                processNewArticle(newArticle[0].id).catch(err =>
                    console.error(`❌ [Sync] AI Pipeline failed for ${newArticle[0].id}:`, err)
                );
            }

            totalNew++;
        }

        console.log(`✅ [SyncService] Feed "${feed.source}" done: ${totalNew} new article(s).`);
        return totalNew;
    } catch (e) {
        console.error(`❌ [SyncService] Error fetching feed ${feed.source}:`, e);
        return 0;
    }
}

// Sync all active feeds (for manual trigger / legacy endpoint)
export async function syncAllFeeds() {
    console.log("🔄 [SyncService] Syncing all active feeds...");
    try {
        const feeds = await db.select().from(rssFeeds).where(eq(rssFeeds.isActive, true));
        let totalNew = 0;
        for (const feed of feeds) {
            totalNew += await syncFeed(feed);
        }
        return totalNew;
    } catch (e) {
        console.error("Sync Service Error:", e);
        return 0;
    }
}

// Sync a single feed by ID (for per-feed cron jobs)
export async function syncSingleFeed(feedId: number) {
    try {
        const feed = await db.query.rssFeeds.findFirst({
            where: (f: any, { eq }: any) => eq(f.id, feedId)
        });
        if (!feed || !feed.isActive) return 0;
        return await syncFeed(feed);
    } catch (e) {
        console.error(`❌ [SyncService] syncSingleFeed error for feed ${feedId}:`, e);
        return 0;
    }
}

function slugifyStr(str: string) {
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}
