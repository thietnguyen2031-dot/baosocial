import { RSSCrawler } from './rss';

async function testCrawler() {
    const crawler = new RSSCrawler();

    // Test with VnExpress Economy
    console.log("Testing VnExpress Kinh Doanh...");
    const items = await crawler.fetchFeed('https://vnexpress.net/rss/kinh-doanh.rss', 'VnExpress');

    console.log(`Fetched ${items.length} items.`);
    if (items.length > 0) {
        console.log("Sample Item:");
        console.log("Title:", items[0].title);
        console.log("Image:", items[0].thumbnail);
        console.log("Snippet:", items[0].contentSnippet);
    }
}

testCrawler().catch(console.error);
