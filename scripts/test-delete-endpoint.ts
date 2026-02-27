import 'dotenv/config';
import { db, articles } from "@packages/db";
import { desc, eq } from "drizzle-orm";

async function run() {
    console.log("Finding an article to delete...");
    const article = await db.query.articles.findFirst({
        orderBy: [desc(articles.createdAt)]
    });

    if (!article) {
        console.log("No article found in DB.");
        process.exit(0);
    }

    console.log(`Testing DELETE endpoint for Article ID: ${article.id}`);

    try {
        const res = await fetch(`http://localhost:3001/articles/${article.id}`, {
            method: 'DELETE'
        });

        console.log(`Status: ${res.status}`);
        const json = await res.json();
        console.log("Response:", JSON.stringify(json, null, 2));

        if (json.deleted > 0) {
            console.log("SUCCESS: API reported deletion.");
        } else {
            console.log("FAILURE: API reported 0 deleted.");
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }

    process.exit(0);
}

run();
