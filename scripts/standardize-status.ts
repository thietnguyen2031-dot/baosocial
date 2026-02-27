
import * as dotenv from "dotenv";
dotenv.config({ path: "e:/AI/baosocial/.env" });

async function standardize() {
    const { db } = await import("../packages/db/src");
    const { articles } = await import("../packages/db/src/schema");
    const { eq } = await import("drizzle-orm");

    try {
        console.log("🔄 Standardizing statuses to UPPERCASE...");

        // Update 'published' -> 'PUBLISHED'
        const pub = await db.update(articles)
            .set({ status: 'PUBLISHED' })
            .where(eq(articles.status, 'published'));
        console.log(`✅ Updated lowercase 'published' to 'PUBLISHED'`);

        // Update 'pending' -> 'PENDING'
        const pend = await db.update(articles)
            .set({ status: 'PENDING' })
            .where(eq(articles.status, 'pending'));
        console.log(`✅ Updated lowercase 'pending' to 'PENDING'`);

        console.log("🎉 Standardization complete!");

        // Check 
        const all = await db.select().from(articles);
        console.log(`Sample status: ${all[0]?.status}`);

    } catch (e) {
        console.error("❌ Failed:", e);
    }
    process.exit(0);
}

standardize();
