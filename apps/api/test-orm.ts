import { db, rssFeeds } from "@packages/db";
import { eq, sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Testing raw DB query...");
        const res = await db.execute(sql`UPDATE rss_feeds SET crawl_minute = 15 WHERE id = 3 RETURNING crawl_minute`);
        console.log("Raw SQL Result:", res);

        const fetchRow = await db.select().from(rssFeeds).where(eq(rssFeeds.id, 3));
        console.log("Row after Raw Update:", fetchRow[0]);

        console.log("Testing Drizzle ORM Update...");
        const resOrm = await db.update(rssFeeds)
            .set({ crawlMinute: 22 })
            .where(eq(rssFeeds.id, 3))
            .returning();

        console.log("ORM Result:", resOrm);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}
run();
