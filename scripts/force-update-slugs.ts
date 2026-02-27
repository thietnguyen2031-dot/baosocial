import { db } from "../packages/db/src";
import { articles } from "../packages/db/src/schema";
import { generateSlug, ensureUniqueSlug } from "../packages/db/src/utils";
import { eq } from "drizzle-orm";

// FORCE update all slugs (no env needed - Next.js will load it)
async function forceUpdateSlugs() {
    console.log("🔄 FORCE updating all slugs...\n");

    try {
        const allArticles = await db.select().from(articles);
        console.log(`📊 Found ${allArticles.length} articles\n`);

        const existingSlugs: string[] = [];
        let updated = 0;

        for (const article of allArticles) {
            const baseSlug = generateSlug(article.title);
            const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

            await db.update(articles)
                .set({ slug: uniqueSlug })
                .where(eq(articles.id, article.id));

            existingSlugs.push(uniqueSlug);
            console.log(`✅ ${article.id}: "${article.title.substring(0, 40)}..." → "${uniqueSlug}"`);
            updated++;
        }

        console.log(`\n🎉 Updated ${updated}/${allArticles.length} articles!`);
        process.exit(0);
    } catch (e: any) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
}

forceUpdateSlugs();
