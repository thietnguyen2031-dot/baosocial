
import * as dotenv from "dotenv";
dotenv.config({ path: "e:/AI/baosocial/.env" });

async function fix() {
    const { db } = await import("../packages/db/src");
    const { articles } = await import("../packages/db/src/schema");
    const { eq } = await import("drizzle-orm");

    try {
        console.log("🔄 Updating PENDING articles to 'published'...");

        await db.update(articles)
            .set({ status: 'published' })
            .where(eq(articles.status, 'PENDING'));

        console.log("✅ Update complete!");

        // Check count
        const all = await db.select().from(articles);
        const published = all.filter(a => a.status === 'published');
        console.log(`📊 Published articles: ${published.length}/${all.length}`);

    } catch (e) {
        console.error("❌ Update Failed:", e);
    }
    process.exit(0);
}

fix();
