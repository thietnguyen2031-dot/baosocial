import 'dotenv/config';
import * as schema from '../packages/db/src/schema'; // Updated import just in case
import { createClient } from '@libsql/client'; // Adjust import based on your db setup if needed, or use the apps/api db instance
// Actually, let's use the same db setup as the app if possible, or just a direct query script.
// Since this is a monorepo, I can try to use the db package if it exports a client.
// Let's assume standard drizzle setup.

// Simpler approach: call the API to get article details.
// But I want to see the raw DB value.
// Let's make a script that uses the `db` package directly.

import { db } from '../packages/db/src/index';
import { count } from 'drizzle-orm'; // Added import for count

async function checkContent() {
    const allCount = await db.select({ count: count() }).from(schema.articles);
    console.log(`Total Articles in DB: ${allCount[0].count}`);

    const all = await db.select().from(schema.articles).limit(5);
    console.log("First 5 articles:", all);
    return; // This return statement will exit the function after logging the first 5 articles.

    // The following code will not be executed due to the 'return' above.
    const articles = await db.query.articles.findMany({
        where: (a, { eq }) => eq(a.status, 'PENDING'),
        limit: 1
    });

    if (articles.length === 0) {
        console.log("No pending articles found.");
        return;
    }

    const art = articles[0];
    console.log(`Title: ${art.title}`);
    console.log(`Content Length: ${art.contentAi?.length || 0}`);
    console.log(`Content Preview: ${art.contentAi?.substring(0, 100)}`);
}

checkContent();
