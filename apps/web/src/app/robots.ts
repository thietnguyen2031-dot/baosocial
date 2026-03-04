import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.benthanhmedia.net';
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/login'],
        },
        sitemap: [
            `${baseUrl}/sitemap.xml`,
            `${baseUrl}/news-sitemap.xml`,
        ],
    };
}
