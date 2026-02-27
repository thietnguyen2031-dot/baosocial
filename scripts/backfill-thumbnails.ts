
import "dotenv/config"; // Ensure env vars are loaded
import { db, articles } from "../packages/db/src";
import { RSSCrawler } from "../packages/crawler/src/rss";
import { eq, isNull, or } from "drizzle-orm";

async function backfill() {
    console.log("Starting thumbnail backfill...");

    // Select articles with missing thumbnails
    // Note: Drizzle's 'isNull' or checking for empty string
    // Simplified: Fetch all and filter in JS if complex SQL is annoying in script
    const allArticles = await db.select().from(articles);
    const missing = allArticles.filter(a => !a.thumbnail || a.thumbnail === "");

    console.log(`Found ${missing.length} articles without thumbnails.`);

    const crawler = new RSSCrawler();
    let updated = 0;

    for (const article of missing) {
        if (!article.sourceUrl) continue;

        console.log(`Processing [${article.id}]: ${article.title}`);
        try {
            // We only need the thumbnail, but fetchContent gets it all. 
            // It's fine for a one-off script.
            const { thumbnail } = await crawler.fetchContent(article.sourceUrl, {});

            if (thumbnail) {
                await db.update(articles)
                    .set({ thumbnail: thumbnail })
                    .where(eq(articles.id, article.id));
                console.log(`✅ Updated thumbnail: ${thumbnail}`);
                updated++;
            } else {
                console.log("⚠️ No thumbnail found.");
            }
        } catch (e) {
            console.error(`❌ Error processing ${article.sourceUrl}:`, e);
        }
    }

    console.log(`Backfill complete. Updated ${updated} articles.`);
    process.exit(0);
}

backfill();
