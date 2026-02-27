
import { RSSCrawler } from "../packages/crawler/src/rss";

// Mock log function
const log = console.log;

async function test() {
    const url = "https://vnexpress.net/chu-tich-quoc-hoi-tran-thanh-man-tham-chinh-thuc-lao-4835639.html"; // Replace with a real recent URL from their feed
    console.log(`Testing thumbnail extraction for: ${url}`);

    const crawler = new RSSCrawler();

    // We don't have specific selectors here, so rely on defaults (og:image, etc.)
    const result = await crawler.fetchContent(url, {});

    console.log("Extraction Result:");
    console.log("Title:", result.title);
    console.log("Thumbnail:", result.thumbnail);
    console.log("Description Length:", result.description?.length);
    console.log("Content Length:", result.content?.length);

    if (result.thumbnail) {
        console.log("✅ SUCCESS: Thumbnail found!");
    } else {
        console.log("❌ FAILURE: No thumbnail found.");
    }
}

test();
