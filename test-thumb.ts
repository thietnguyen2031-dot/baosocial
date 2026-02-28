import { RSSCrawler } from './packages/crawler/src/rss';

async function test() {
    const crawler = new RSSCrawler();
    const url = "https://thethao247.vn/437-real-madrid-lap-ky-luc-champions-league-100-vao-vong-1-8-d364213.html"; // sample from image
    console.log("Fetching content...");
    const extracted = await crawler.fetchContent(url, {
        contentSelector: '.detail-content',
        excludeSelector: '.related-news,.author-box'
    });

    console.log("--- Extraction Results ---");
    console.log("Thumbnail extracted:", extracted.thumbnail);
    console.log("Length of content:", extracted.content.length);
}

test();
