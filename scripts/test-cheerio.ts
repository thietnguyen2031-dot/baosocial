
async function testCheerio() {
    console.log("Testing dynamic import of cheerio...");
    try {
        const cheerio = await import('cheerio');
        console.log("Keys on imported cheerio:", Object.keys(cheerio));
        console.log("Type of cheerio.load:", typeof cheerio.load);

        if (cheerio.default) {
            console.log("cheerio.default exists.");
            // @ts-ignore
            console.log("Type of cheerio.default.load:", typeof cheerio.default.load);
        }

        const html = '<div><p>Hello</p></div>';
        try {
            const $ = cheerio.load(html);
            console.log("cheerio.load works directly. Text:", $('p').text());
        } catch (e) {
            console.log("cheerio.load direct call failed:", e.message);
            if (cheerio.default && cheerio.default.load) {
                const $ = cheerio.default.load(html);
                console.log("cheerio.default.load works. Text:", $('p').text());
            }
        }

    } catch (e) {
        console.error("Import failed:", e);
    }
}

testCheerio();
