import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.benthanhmedia.net';

    let articles = [];
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/news?limit=100`, {
            cache: 'no-store'
        });
        const data = await res.json();
        if (data.success) articles = data.data;
    } catch (e) {
        console.error("RSS fetch error", e);
    }

    const settings = await getSettings();
    const siteTitle = settings.siteName?.trim() || 'BaoSocial - Tin tức thế hệ mới';
    const siteDesc = settings.siteDescription?.trim() || 'Nền tảng tin tức tổng hợp thông minh';

    const cleanText = (text: string | null | undefined) => {
        if (!text) return '';
        const t = String(text).trim();
        return t === 'undefined' || t === 'null' ? '' : t;
    };

    const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${siteTitle}]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[${siteDesc}]]></description>
    <language>vi</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${articles.map((article: any) => {
        const title = cleanText(article.title);
        const desc = cleanText(article.contentSnippet || article.description);
        const category = cleanText(article.category);
        const fullContent = article.content ? `<![CDATA[${article.content}]]>` : '';

        return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${baseUrl}/tin/${article.slug || article.id}</link>
      <guid isPermaLink="true">${baseUrl}/tin/${article.slug || article.id}</guid>
      <pubDate>${new Date(article.publishedAt || article.pubDate || new Date()).toUTCString()}</pubDate>
      ${desc ? `<description><![CDATA[${desc}]]></description>` : '<description><![CDATA[]]></description>'}
      ${fullContent ? `<content:encoded>${fullContent}</content:encoded>` : ''}
      ${category ? `<category><![CDATA[${category}]]></category>` : ''}
      ${article.thumbnail ? `<media:content url="${article.thumbnail}" medium="image"/>` : ''}
    </item>`;
    }).join('\n')}
  </channel>
</rss>`;

    return new NextResponse(feed, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        },
    });
}
