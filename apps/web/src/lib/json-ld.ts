import { Article, WithContext } from 'schema-dts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.benthanhmedia.net';

export function generateJsonLd(article: any): WithContext<Article> {
    return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        image: [article.thumbnail || ''],
        datePublished: article.publishedAt || article.pubDate,
        dateModified: article.updatedAt || article.publishedAt || article.pubDate,
        author: [{
            '@type': 'Organization',
            name: article.source || 'BaoSocial'
        }],
        publisher: {
            '@type': 'Organization',
            name: 'BaoSocial',
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo.png`
            }
        },
        description: article.summary,
        url: `${SITE_URL}/tin/${article.slug || article.id}`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/tin/${article.slug || article.id}` },
    };
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}
