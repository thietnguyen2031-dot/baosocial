import { crawler } from './packages/crawler/src/index.js';
import * as fs from 'fs';

async function run() {
    const targetUrl = "http://baoquocte.vn/galatasaray-lan-dau-lot-vong-18-uefa-champions-league-sau-12-nam-363297.html";

    console.log("Fetching content from:", targetUrl);

    try {
        const result = await crawler.fetchContent(targetUrl);
        const content = result.content || "";

        const debugData = {
            title: result.title,
            desc: result.description,
            thumbnail: result.thumbnail,
            contentLength: content.length,
            rawImages: [...content.matchAll(/<img[^>]*>/gi)].map(m => m[0].substring(0, 150))
        };

        fs.writeFileSync('bqt-debug.json', JSON.stringify(debugData, null, 2));
        console.log("Debug data written to bqt-debug.json");
    } catch (err) {
        console.error("Crawler failed:", err);
    }
}

run().catch(console.error);
