
import { fetchFeed } from '../packages/crawler/src/index';

async function test() {
    const url = "https://baoquocte.vn/kinh-te";
    console.log(`Testing URL: ${url}`);

    // Direct call
    const items = await fetchFeed(url);
    console.log(`Result items: ${items.length}`);
    if (items.length > 0) {
        console.log("First item:", items[0]);
    }
}

test();
