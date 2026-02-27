import { db } from "../index"; // Ensure this imports the db instance correctly 
// OR simpler: re-instantiate db here if index.ts doesn't export it cleanly for internal use without circular deps
// Actually index.ts exports `db`. 
// But importing `db` from index.ts might cause side effects (running the server code).
// standard practice: move `db` to `db.ts` or `database.ts` or rely on `@packages/db`.
// Let's use `@packages/db` directly.

import { db, rssFeeds, articles } from "@packages/db";
import { fetchFeed } from "./crawler"; // Assuming crawler logic is accessible
import * as crawler from "../crawler"; // Need to verify where crawler is
import { slugify } from "./utils"; // Verify utils existence or use lib
// Wait, `crawler` is imported in index.ts as `import * as crawler from "./crawler";`
// Let's check where `crawler.ts` is. 

type CrawlerModule = typeof import("../crawler");

export async function syncAllFeeds() {
    console.log("🔄 [SyncService] Syncing all feeds...");
    try {
        const feeds = await db.select().from(rssFeeds);

        // Dynamic import to avoid circular dependency issues if any
        const crawler = await import("../crawler");

        let totalNew = 0;

        for (const feed of feeds) {
            console.log(`📡 [SyncService] Fetching feed: ${feed.name}`);
            try {
                const items = await crawler.fetchFeed(feed.url);

                for (const item of items) {
                    // Check duplicate
                    const existing = await db.query.articles.findFirst({
                        where: (a, { eq }) => eq(a.sourceUrl, item.link)
                    });

                    if (existing) continue;

                    // New article
                    const baseSlug = item.title ? slugifyStr(item.title) : "untitled";
                    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

                    // Fetch content
                    const { content: fullContent, title: scrapedTitle, description: scrapedDesc, thumbnail: scrapedThumbnail } = await crawler.fetchContent(item.link, {
                        contentSelector: feed.contentSelector,
                        excludeSelector: feed.excludeSelector,
                        titleSelector: feed.titleSelector,
                        descriptionSelector: feed.descriptionSelector
                    });

                    const newArticle = await db.insert(articles).values({
                        title: scrapedTitle || item.title || "Untitled",
                        slug: uniqueSlug,
                        summary: scrapedDesc || item.contentSnippet || "",
                        contentAi: fullContent,
                        thumbnail: item.thumbnail || scrapedThumbnail || null,
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
                console.error(`❌ [SyncService] Error fetching feed ${feed.name}:`, e);
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
