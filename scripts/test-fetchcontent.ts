import { RSSCrawler } from '../packages/crawler/src/rss';

async function test() {
    const crawler = new RSSCrawler();

    // Use exact selectors from DB
    const url = "https://baoquocte.vn/gia-heo-hoi-hom-nay-42-mien-bac-va-trung-duy-tri-da-giam-mien-nam-di-ngang-355785.html";

    console.log("Testing fetchContent for:", url);
    console.log("Using selectors from DB:");

    const result = await crawler.fetchContent(url, {
        contentSelector: '#__MB_MASTERCMS_EL_3',  // From DB (not FL_3)
        excludeSelector: 'div#__MB_MASTERCMS_EL_3 > table:nth-of-type(1)',
        titleSelector: '.article-detail-title.f0',
        descriptionSelector: '.article-detail-desc.fw.lt.f0.mb.clearfix'
    });

    console.log("\n=== RESULT ===");
    console.log("Title:", result.title);
    console.log("Description:", result.description?.substring(0, 100) + "...");
    console.log("Content length:", result.content?.length || 0);
    console.log("Content preview:", result.content?.substring(0, 200) + "...");
}

test();
