import { NextResponse } from 'next/server';

export const revalidate = 1800; // 30 min — Google News requires recent articles

// Google News Sitemap — Only articles from last 48 hours
// Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.benthanhmedia.net';
    const siteName = 'BaoSocial';
    const lang = 'vi';

    let articles: any[] = [];
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/news?limit=100`);
        const data = await res.json();
        if (data.success) articles = data.data;
    } catch (e) {
        console.error("[NewsSitemap] Fetch error:", e);
    }

    // Filter: only articles from last 48 hours (Google News requirement)
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recentArticles = articles.filter((a: any) => {
        const pub = new Date(a.pubDate || a.publishedAt).getTime();
        return pub >= cutoff;
    });

    const urls = recentArticles.map((article: any) => {
        const pubDate = new Date(article.pubDate || article.publishedAt).toISOString();
        const articleUrl = `${baseUrl}/tin/${article.slug || article.id}`;
        const title = (article.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const imageTag = article.thumbnail
            ? `\n    <image:image><image:loc>${article.thumbnail}</image:loc></image:image>`
            : '';
        return `
  <url>
    <loc>${articleUrl}</loc>
    <news:news>
      <news:publication>
        <news:name>${siteName}</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>${imageTag}
  </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
        },
    });
}
