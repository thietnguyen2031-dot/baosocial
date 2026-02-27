import 'dotenv/config';
import { db, articles } from "@packages/db";
import { RSSCrawler } from "@packages/crawler";
import { eq, like, desc } from "drizzle-orm";

async function run() {
    console.log("Searching for article 'Căng thẳng Nga-Ukraine'...");

    const article = await db.query.articles.findFirst({
        where: (a, { like }) => like(a.title, "%Nga-Ukraine%"),
        orderBy: [desc(articles.createdAt)]
    });

    if (!article) {
        console.error("Article not found!");
        process.exit(1);
    }

    console.log(`Found article: ${article.title}`);
    console.log(`URL: ${article.sourceUrl}`);

    if (!article.sourceUrl) {
        console.error("No Source URL!");
        process.exit(1);
    }

    const crawler = new RSSCrawler();
    console.log("Fetching content...");

    // Simulate what the sync does
    const result = await crawler.fetchContent(article.sourceUrl, {
        // We don't know the exact feed config here easily without joining, 
        // but let's try generic first, or try to lookup feed.
    });

    console.log("--- Fetch Result ---");
    console.log("Title:", result.title);
    console.log("Description:", result.description);
    console.log("Content Length:", result.content?.length);
    console.log("Content Preview:", result.content?.substring(0, 500));

    process.exit(0);
}

run();
