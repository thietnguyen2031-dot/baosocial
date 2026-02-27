
import * as dotenv from "dotenv";
dotenv.config({ path: "e:/AI/baosocial/.env" });

async function reset() {
    const { db } = await import("../packages/db/src");
    const { articles, favorites, comments } = await import("../packages/db/src/schema");
    const { isNotNull } = await import("drizzle-orm");

    try {
        console.log("🗑️ Cleaning up related data (favorites, comments)...");
        // Delete ALL favorites and comments for simplicity in dev/test reset
        await db.delete(favorites);
        await db.delete(comments);

        console.log("🗑️ Deleting all CRAWLED articles (where sourceUrl is not null)...");

        const result = await db.delete(articles)
            .where(isNotNull(articles.sourceUrl));

        console.log("✅ Deleted crawled articles.");

        const all = await db.select().from(articles);
        console.log(`📊 Remaining articles: ${all.length}`);

    } catch (e) {
        console.error("❌ Reset Failed:", e);
    }
    process.exit(0);
}

reset();
