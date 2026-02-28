import { Client } from 'pg';

async function run() {
    const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_x3czKlho7jSJ@ep-red-flower-a1yik4cd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    });

    await client.connect();

    const res = await client.query(`
    SELECT title, thumbnail, content_ai as "contentAi" 
    FROM articles 
    WHERE title LIKE '%Lễ hội Việt-Nhật%' OR title LIKE '%Champions League%'
    ORDER BY published_at DESC 
    LIMIT 3;
  `);

    for (const row of res.rows) {
        console.log("------------------------");
        console.log("TITLE:", row.title);
        console.log("THUMBNAIL:", row.thumbnail);

        // Check if content has img tags
        const content = row.contentAi || "";
        const imgMatch = content.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
        console.log("AI CONTENT HAS IMG MATCH?:", imgMatch ? imgMatch[1] : "NO MATCH");

        // Find all img tags for debug
        const allMatches = [...content.matchAll(/<img[^>]*>/gi)];
        console.log(`FOUND ${allMatches.length} raw <img...> tags in contentAi`);
        if (allMatches.length > 0) {
            console.log("Raw tags:");
            allMatches.forEach(m => console.log(m[0].substring(0, 100)));
        }
    }

    await client.end();
}

run().catch(console.error);
