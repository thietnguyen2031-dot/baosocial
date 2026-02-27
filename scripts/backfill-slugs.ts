import { db } from "../packages/db/src";
import { articles } from "../packages/db/src/schema";
import { generateSlug, ensureUniqueSlug } from "../packages/db/src/utils";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables for standalone script execution
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function backfillSlugs() {
    console.log("🔄 Starting slug backfill...\n");

    try {
        // Get all articles
        const allArticles = await db.select().from(articles);
        console.log(`📊 Found ${allArticles.length} articles to process\n`);

        const existingSlugs: string[] = allArticles
            .filter(a => a.slug && a.slug.trim() !== "")
            .map(a => a.slug);

        let updated = 0;
        let skipped = 0;

        for (const article of allArticles) {
            // Skip if already has a valid slug
            if (article.slug && article.slug.trim() !== "") {
                console.log(`⏭️  Skipping article ${article.id}: already has slug "${article.slug}"`);
                skipped++;
                continue;
            }

            // Generate slug from title
            const baseSlug = generateSlug(article.title);
            const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

            // Update article
            await db.update(articles)
                .set({ slug: uniqueSlug })
                .where(eq(articles.id, article.id));

            // Add to existing slugs list
            existingSlugs.push(uniqueSlug);

            console.log(`✅ Updated article ${article.id}: "${article.title}" → "${uniqueSlug}"`);
            updated++;
        }

        console.log(`\n🎉 Backfill complete!`);
        console.log(`  ✅ Updated: ${updated}`);
        console.log(`  ⏭️  Skipped: ${skipped}`);
        console.log(`  📊 Total: ${allArticles.length}`);

    } catch (e: any) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }

    process.exit(0);
}

backfillSlugs();
