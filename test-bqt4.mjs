import crawler from './packages/crawler/src/index.js';

async function run() {
    const url = "http://baoquocte.vn/galatasaray-lan-dau-lot-vong-18-uefa-champions-league-sau-12-nam-363297.html";
    console.log("Fetching using Crawler module:", url);
    const result = await crawler.fetchContent(url);

    console.log("TITLE:", result.title);
    console.log("OG THUMBNAIL:", result.thumbnail);

    const content = result.content || "";
    console.log("CONTENT LENGTH:", content.length);

    // Check if we captured valid <img src="..." />
    const allMatches = [...content.matchAll(/<img[^>]*>/gi)];
    console.log(`FOUND ${allMatches.length} raw <img...> tags in CRAWLED content`);
    if (allMatches.length > 0) {
        allMatches.forEach(m => console.log(m[0].substring(0, 150)));
    } else {
        console.log("STILL NO IMAGES FOUND IN CRAWLED CONTENT.");
    }
}

run().catch(console.error);
