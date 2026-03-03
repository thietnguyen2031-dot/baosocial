import { Article, WithContext } from 'schema-dts';

export function generateJsonLd(article: any): WithContext<Article> {
    return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        image: [article.thumbnail || ''],
        datePublished: article.publishedAt || article.pubDate,
        dateModified: article.publishedAt || article.pubDate,
        author: [{
            '@type': 'Organization',
            name: article.source || 'BaoSocial'
        }],
        publisher: {
            '@type': 'Organization',
            name: 'BaoSocial',
            logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://benthanhmedia.net'}/logo.png`
            }
        },
        description: article.summary
    };
}
