import { db, rssFeeds, articles } from "@packages/db";

export async function syncAllFeeds() {
    console.log("🔄 [SyncService] Syncing all feeds...");
    try {
        const feeds = await db.select().from(rssFeeds);

        // Dynamic import to avoid circular dependency issues
        const crawler = await import("@packages/crawler");

        let totalNew = 0;

        for (const feed of feeds) {
            console.log(`📡 [SyncService] Fetching feed: ${feed.source}`);
            try {
                const items = await crawler.fetchFeed(feed.url);

                for (const item of items) {
                    // Check duplicate
                    const existing = await db.query.articles.findFirst({
                        where: (a: any, { eq }: any) => eq(a.sourceUrl, item.link)
                    });

                    if (existing) continue;

                    // New article
                    const baseSlug = item.title ? slugifyStr(item.title) : "untitled";
                    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

                    // Fetch content - cast to include thumbnail field
                    const contentResult = await crawler.fetchContent(item.link, {
                        contentSelector: feed.contentSelector,
                        excludeSelector: feed.excludeSelector,
                        titleSelector: feed.titleSelector,
                        descriptionSelector: feed.descriptionSelector
                    }) as { content: string; title?: string; description?: string; thumbnail?: string };

                    const { content: fullContent, title: scrapedTitle, description: scrapedDesc, thumbnail: scrapedThumbnail } = contentResult;

                    const newArticle = await db.insert(articles).values({
                        title: scrapedTitle || item.title || "Untitled",
                        slug: uniqueSlug,
                        summary: scrapedDesc || (item as any).contentSnippet || "",
                        contentAi: fullContent,
                        thumbnail: (item as any).thumbnail || scrapedThumbnail || null,
                        category: feed.category,
                        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        status: "PENDING" // Wait for AI & Telegram Approval
                    }).returning();

                    if (newArticle[0]) {
                        // Trigger AI Pipeline in background
                        const { processNewArticle } = await import("./ai-pipeline");
                        processNewArticle(newArticle[0].id).catch(err =>
                            console.error(`❌ [Sync] AI Pipeline failed for ${newArticle[0].id}:`, err)
                        );
                    }

                    totalNew++;
                }
            } catch (e) {
                console.error(`❌ [SyncService] Error fetching feed ${feed.source}:`, e);
            }
        }

        return totalNew;
    } catch (e) {
        console.error("Sync Service Error:", e);
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
