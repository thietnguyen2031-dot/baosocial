import 'dotenv/config';
import { db, articles } from "@packages/db";
import { eq, sql } from "drizzle-orm";

async function run() {
    console.log("Fixing article statuses...");

    // Fix 'published' -> 'PUBLISHED'
    const res1 = await db.update(articles)
        .set({ status: "PUBLISHED" })
        .where(eq(articles.status, "published"))
        .returning();
    console.log(`Updated ${res1.length} articles from 'published' to 'PUBLISHED'.`);

    // Fix 'pending' -> 'PENDING' (just in case)
    const res2 = await db.update(articles)
        .set({ status: "PENDING" })
        .where(eq(articles.status, "pending"))
        .returning();
    console.log(`Updated ${res2.length} articles from 'pending' to 'PENDING'.`);

    process.exit(0);
}

run();
