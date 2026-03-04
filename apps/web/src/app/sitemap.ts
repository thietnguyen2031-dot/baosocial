import { MetadataRoute } from 'next';

export const revalidate = 3600; // Regenerate every 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.benthanhmedia.net';

    let articles: any[] = [];
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/news?limit=1000`);
        const data = await res.json();
        if (data.success) articles = data.data;
    } catch (e) {
        console.error("[Sitemap] Fetch error:", e);
    }

    // Static pages (no priority/changefreq — Google ignores them per 2025+ guidelines)
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/the-thao`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/kinh-te`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/the-gioi`,
            lastModified: new Date(),
        },
    ];

    // Article pages — minimal, clean format (loc + lastmod only per 2026 guidelines)
    const newsUrls: MetadataRoute.Sitemap = articles.map((article: any) => ({
        url: `${baseUrl}/tin/${article.slug || article.id}`,
        lastModified: new Date(article.pubDate || article.publishedAt),
    }));

    return [...staticPages, ...newsUrls];
}
