import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'http://localhost:3000'; // Replace with env var in prod

    // Fetch critical articles
    // In production, fetch ALL slugs or top 1000
    let articles = [];
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/news`);
        const data = await res.json();
        if (data.success) articles = data.data;
    } catch (e) {
        console.error("Sitemap fetch error", e);
    }

    const newsUrls = articles.map((article: any) => ({
        url: `${baseUrl}/tin/${article.slug || article.id}`,
        lastModified: new Date(article.pubDate),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...newsUrls,
    ];
}
