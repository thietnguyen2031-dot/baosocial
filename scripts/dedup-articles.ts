import { db } from "../packages/db";
import { articles, comments, favorites } from "../packages/db/src/schema";
import { eq, inArray } from "drizzle-orm";

async function run() {
    console.log("🧹 [Dedup] Starting deduplication process...");

    try {
        // Fetch all articles
        const allArticles = await db.select().from(articles);
        console.log(`[Dedup] Total articles in DB: ${allArticles.length}`);

        // Group by title (case-insensitive)
        const groups = new Map<string, typeof allArticles>();

        for (const a of allArticles) {
            const normalizedTitle = a.title.toLowerCase().trim();
            if (!groups.has(normalizedTitle)) {
                groups.set(normalizedTitle, []);
            }
            groups.get(normalizedTitle)!.push(a);
        }

        const toDelete: number[] = [];
        let keeperCount = 0;

        for (const [title, group] of groups.entries()) {
            if (group.length <= 1) {
                keeperCount++;
                continue; // No duplicates for this title
            }

            console.log(`[Dedup] Found ${group.length} duplicates for: "${title.substring(0, 50)}..."`);

            // Sort group: Priority to PUBLISHED, then by latest created/published Date
            group.sort((a, b) => {
                if (a.status === 'PUBLISHED' && b.status !== 'PUBLISHED') return -1;
                if (b.status === 'PUBLISHED' && a.status !== 'PUBLISHED') return 1;

                const dateA = a.publishedAt?.getTime() || a.createdAt?.getTime() || 0;
                const dateB = b.publishedAt?.getTime() || b.createdAt?.getTime() || 0;
                return dateB - dateA; // Descending (latest first)
            });

            // Keep the first one (highest priority)
            const keep = group[0];
            keeperCount++;

            // Mark the rest for deletion
            for (let i = 1; i < group.length; i++) {
                toDelete.push(group[i].id);
            }
        }

        console.log(`[Dedup] Unique articles to keep: ${keeperCount}`);
        console.log(`[Dedup] Duplicate articles to delete: ${toDelete.length}`);

        if (toDelete.length === 0) {
            console.log("✅ [Dedup] No duplicates found. Database is clean.");
            process.exit(0);
        }

        // Batch delete in chunks of 50 to avoid max parameter limits
        const chunkSize = 50;
        let deletedCount = 0;

        for (let i = 0; i < toDelete.length; i += chunkSize) {
            const chunk = toDelete.slice(i, i + chunkSize);

            // Cascade manual delete
            await db.delete(comments).where(inArray(comments.articleId, chunk));
            await db.delete(favorites).where(inArray(favorites.articleId, chunk));
            await db.delete(articles).where(inArray(articles.id, chunk));

            deletedCount += chunk.length;
            console.log(`[Dedup] Deleted ${deletedCount}/${toDelete.length}...`);
        }

        console.log(`✅ [Dedup] Successfully deleted ${deletedCount} duplicate articles.`);
        process.exit(0);

    } catch (e) {
        console.error("❌ [Dedup] Error:", e);
        process.exit(1);
    }
}

run();
