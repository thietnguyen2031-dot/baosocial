import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function run() {
    const url = "http://baoquocte.vn/galatasaray-lan-dau-lot-vong-18-uefa-champions-league-sau-12-nam-363297.html";
    console.log("Fetching:", url);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates = [];
    $('*').each((i, el) => {
        const id = $(el).attr('id');
        const cls = $(el).attr('class');
        if (id && id.includes('content')) candidates.push(`ID: ${id}`);
        if (cls && cls.includes('content') && !cls.includes('menu')) candidates.push(`CLASS: ${cls}`);
        if (cls && cls.includes('article') && !cls.includes('menu')) candidates.push(`CLASS: ${cls}`);
    });

    console.log("Possible Content Classes:");
    console.log([...new Set(candidates)]);
}

run().catch(console.error);
