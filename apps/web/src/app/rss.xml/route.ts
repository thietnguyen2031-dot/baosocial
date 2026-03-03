import { NextResponse } from 'next/server';

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://benthanhmedia.net';

    let articles = [];
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/news?limit=100`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        const data = await res.json();
        if (data.success) articles = data.data;
    } catch (e) {
        console.error("RSS fetch error", e);
    }

    const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>BaoSocial - Tin tức thế hệ mới</title>
    <link>${baseUrl}</link>
    <description>Nền tảng tin tức tổng hợp thông minh</description>
    <language>vi</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${articles.map((article: any) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${baseUrl}/tin/${article.slug || article.id}</link>
      <guid isPermaLink="true">${baseUrl}/tin/${article.slug || article.id}</guid>
      <pubDate>${new Date(article.publishedAt || article.pubDate).toUTCString()}</pubDate>
      <description><![CDATA[${article.summary}]]></description>
      ${article.category ? `<category><![CDATA[${article.category}]]></category>` : ''}
      ${article.thumbnail ? `<media:content url="${article.thumbnail}" medium="image"/>` : ''}
    </item>`).join('')}
  </channel>
</rss>`;

    return new NextResponse(feed, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
