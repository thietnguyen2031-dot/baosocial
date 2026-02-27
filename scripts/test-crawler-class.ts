
import dotenv from 'dotenv';
import path from 'path';

// Load env from apps/web/.env
dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env') });

import { RSSCrawler } from '../packages/crawler/src/rss';

async function testCrawlerClass() {
    console.log("Instantiating RSSCrawler...");
    const crawler = new RSSCrawler();

    const url = "https://baoquocte.vn/gia-heo-hoi-hom-nay-42-mien-bac-va-trung-duy-tri-da-giam-mien-nam-di-ngang-355785.html";
    console.log(`Testing failing URL: ${url}`);

    // Config from DB (exact values I observed earlier)
    const config = {
        contentSelector: '#__MB_MASTERCMS_EL_3',
        excludeSelector: 'div#__MB_MASTERCMS_EL_3 > table:nth-of-type(1)',
        titleSelector: '.article-detail-title.f0',
        descriptionSelector: '.article-detail-desc.fw.lt.f0.mb.clearfix'
    };

    console.log("Calling crawler.fetchContent with config:", config);

    try {
        const result = await crawler.fetchContent(url, config);
        console.log("Result:");
        console.log("- Title length:", result.title?.length);
        console.log("- Description length:", result.description?.length);
        console.log("- Content length:", result.content?.length);
        console.log("- Content preview:", result.content?.substring(0, 200));

        if (!result.content || result.content.length === 0) {
            console.log("⚠️ Content is EMPTY! Selectors might be wrong or HTML structure is different.");
        } else {
            console.log("✅ Content fetched successfully!");
        }
    } catch (error) {
        console.error("Crawler failed:", error);
    }
}

testCrawlerClass();
