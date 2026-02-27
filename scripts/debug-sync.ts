import 'dotenv/config';
import { db, rssFeeds, articles } from "@packages/db";
import { RSSCrawler } from "@packages/crawler";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Running manual debug sync...");
    const crawler = new RSSCrawler();

    // 1. Check Feeds
    const feeds = await db.select().from(rssFeeds);
    console.log(`Feeds found: ${feeds.length}`);
    if (feeds.length === 0) {
        console.log("No feeds! Seeding default feeds...");
        await db.insert(rssFeeds).values([
            { url: "https://vnexpress.net/rss/tin-moi-nhat.rss", source: "VnExpress", category: "Kinh Tế" } // Use existing category
        ]);
    }

    // 2. Run Sync Logic manually
    const activeFeeds = await db.query.rssFeeds.findMany({ where: (f, { eq }) => eq(f.isActive, true) });
    console.log(`Active feeds: ${activeFeeds.length}`);

    for (const feed of activeFeeds) {
        console.log(`Fetching ${feed.url}...`);
        try {
            const items = await crawler.fetchFeed(feed.url, feed.source);
            console.log(`Items found: ${items.length}`);

            if (items.length > 0) {
                const item = items[0]; // Try just 1
                const baseSlug = item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || "untitled";
                const uniqueSlug = `${baseSlug}-${Date.now()}`;

                console.log(`Inserting article: ${item.title}`);
                const res = await db.insert(articles).values({
                    title: item.title || "Untitled",
                    slug: uniqueSlug,
                    summary: item.contentSnippet || "",
                    contentAi: "Debug content",
                    sourceUrl: item.link,
                    category: feed.category,
                    publishedAt: new Date(),
                    status: "PENDING"
                }).returning();
                console.log("Insert result:", res);
            }
        } catch (e) {
            console.error("Sync error:", e);
        }
    }
    process.exit(0);
}

run();
