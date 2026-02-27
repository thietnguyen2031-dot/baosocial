import 'dotenv/config';
import { db, articles, favorites, comments } from "@packages/db";
import { eq, desc } from "drizzle-orm";

async function run() {
    console.log("Testing Article Deletion...");

    // Find an article to delete
    const article = await db.query.articles.findFirst({
        orderBy: [desc(articles.createdAt)]
    });

    if (!article) {
        console.log("No articles to delete.");
        process.exit(0);
    }

    console.log(`Attempting to delete article ID: ${article.id} - ${article.title}`);

    try {
        // 1. Delete Deps
        console.log("Deleting dependencies...");
        await db.delete(favorites).where(eq(favorites.articleId, article.id));
        await db.delete(comments).where(eq(comments.articleId, article.id));

        // 2. Delete Article
        console.log("Deleting article...");
        const res = await db.delete(articles).where(eq(articles.id, article.id)).returning();

        console.log("Delete Result:", res);

        // Verify
        const check = await db.query.articles.findFirst({ where: (a, { eq }) => eq(a.id, article.id) });
        if (!check) {
            console.log("SUCCESS: Article verified deleted.");
        } else {
            console.error("FAILURE: Article still exists!");
        }

    } catch (e) {
        console.error("Delete FAILED:", e);
    }

    process.exit(0);
}

run();
