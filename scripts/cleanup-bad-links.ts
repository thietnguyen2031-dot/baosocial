import 'dotenv/config';
import { db, articles } from "@packages/db";
import { like } from "drizzle-orm";

async function run() {
    console.log("Cleaning up .topic links...");

    // Delete articles where sourceUrl contains .topic
    const res = await db.delete(articles)
        .where(like(articles.sourceUrl, "%.topic%"))
        .returning();

    console.log(`Deleted ${res.length} articles with '.topic' in URL.`);

    // Also cleanup /chu-de/ just in case
    const res2 = await db.delete(articles)
        .where(like(articles.sourceUrl, "%/chu-de/%"))
        .returning();
    console.log(`Deleted ${res2.length} articles with '/chu-de/'.`);

    process.exit(0);
}

run();
