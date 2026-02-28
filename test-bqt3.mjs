import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function run() {
    const url = "http://baoquocte.vn/galatasaray-lan-dau-lot-vong-18-uefa-champions-league-sau-12-nam-363297.html";
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Exact logic from crawler
    const contentHtml = $('.article-detail').html() || '';
    console.log("Extracted HTML length:", contentHtml.length);

    const elementsWithDataSrc = [];
    $('.article-detail').find('*').each((i, el) => {
        // BaoQuocTe often uses <div> or <span> instead of <img>, or arbitrary data attributes
        const attribs = el.attribs || {};
        for (const [key, value] of Object.entries(attribs)) {
            if (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.webp')) {
                elementsWithDataSrc.push({ tag: el.tagName, key, value: value.substring(0, 100) });
            }
        }
    });

    console.log("Elements containing image extensions:");
    console.log(elementsWithDataSrc.slice(0, 10));
}

run().catch(console.error);
