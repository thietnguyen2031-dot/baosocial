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

    $('script, style, nav, header, footer, .ads, .comments, .related-posts, .menu').remove();
    $('.__mb_article_in_image').remove();

    let content = '';
    const el = $('#content-body');
    if (el.length > 0) {
        content = el.html() || '';
    } else {
        const article = $('article');
        if (article.length > 0) {
            content = article.html() || '';
        } else {
            content = $('.detail-content').html() || '';
        }
    }

    fs.writeFileSync('bqt-raw.html', html);
    console.log("Wrote full HTML. Content Length:", html.length);
}

run().catch(console.error);
