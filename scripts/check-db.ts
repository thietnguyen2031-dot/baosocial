
import * as dotenv from "dotenv";
import path from "path";

// Load env FIRST
const envPath = "e:/AI/baosocial/.env";
dotenv.config({ path: envPath });
console.log(`Loaded .env from ${envPath}`);
console.log(`DATABASE_URL starts with: ${process.env.DATABASE_URL?.substring(0, 15)}...`);

async function check() {
    // Dynamic import to ensure env is loaded before DB init
    const { db } = await import("../packages/db/src");
    const { articles } = await import("../packages/db/src/schema");
    const { isNull, eq } = await import("drizzle-orm");

    try {
        const all = await db.select().from(articles);
        console.log(`✅ Total articles in DB: ${all.length}`);

        const nullStatus = all.filter(a => a.status === null);
        const publishedStatus = all.filter(a => a.status === 'published');

        console.log(`📊 Status Breakdown:`);
        console.log(`- NULL: ${nullStatus.length}`);
        console.log(`- Published: ${publishedStatus.length}`);
        console.log(`- Other: ${all.length - nullStatus.length - publishedStatus.length}`);

        if (all.length > 0) {
            console.log(`📝 Sample: ${all[0].title.substring(0, 30)}... [${all[0].status}]`);
        }
    } catch (e: any) {
        console.error("❌ DB Check Failed:", e);
    }
}

check();
