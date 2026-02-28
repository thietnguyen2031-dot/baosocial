import Parser from 'rss-parser';

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    contentSnippet?: string;
    content?: string;
    guid?: string;
    categories?: string[];
    thumbnail?: string;
    source: string;
}

// Giúp trích xuất ảnh chuẩn, hỗ trợ lazy-loading
const extractRealImageSrc = (imgEl: any): string | undefined => {
    if (!imgEl) return undefined;
    return imgEl.attr('data-src') ||
        imgEl.attr('data-original') ||
        imgEl.attr('data-lazy-src') ||
        imgEl.attr('src');
};

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'media'],
            ['description', 'description'],
        ]
    }
});

export class RSSCrawler {
    async fetchFeed(url: string, sourceName: string): Promise<NewsItem[]> {
        // Try RSS first
        try {
            console.log(`[RSS Crawler] Parsing RSS: ${url}`);
            const feed = await parser.parseURL(url);

            if (!feed.items || feed.items.length === 0) {
                console.log(`[RSS Crawler] RSS parsed but 0 items. Fallback to HTML scraping.`);
                return await this.scrapeHtml(url, sourceName);
            }

            console.log(`[RSS Crawler] Fetched ${feed.items.length} items from ${sourceName}`);

            return feed.items.map(item => {
                // Try to extract image from standard RSS fields or description
                let imageUrl = '';
                if (item['media'] && item['media']['$'] && item['media']['$']['url']) {
                    imageUrl = item['media']['$']['url'];
                } else if (item.description) {
                    // Xử lý ảnh nằm trong CDATA thẻ description (VD: thethao247.vn)
                    const imgMatch = item.description.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
                    if (imgMatch) {
                        imageUrl = imgMatch[1];
                    }
                }

                // Clean up description (remove HTML tags)
                const cleanDescription = item.contentSnippet || item.description?.replace(/<[^>]*>?/gm, '') || '';

                return {
                    title: item.title || 'No Title',
                    link: item.link || '',
                    pubDate: item.pubDate || new Date().toISOString(),
                    contentSnippet: cleanDescription.substring(0, 300) + (cleanDescription.length > 300 ? '...' : ''),
                    guid: item.guid || item.link || '',
                    categories: item.categories,
                    thumbnail: imageUrl,
                    source: sourceName
                };
            });
        } catch (error) {
            console.log(`[RSS Crawler] RSS Parse failed. Trying HTML Scrape.`);
            return await this.scrapeHtml(url, sourceName);
        }
    }

    private async scrapeHtml(url: string, sourceName: string): Promise<NewsItem[]> {
        console.log(`[RSS Crawler] Starting HTML Scrape for: ${url}`);
        try {
            const cheerio = await import('cheerio');
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            console.log(`[RSS Crawler] HTML Fetch Status: ${res.status}`);

            if (!res.ok) {
                console.error(`[RSS Crawler] Failed to fetch HTML. Status: ${res.status}`);
                return [];
            }

            const html = await res.text();
            const $ = cheerio.load(html);
            const items: NewsItem[] = [];

            // Generic logic to find article links in a category page
            const selectors = [
                'h1 a', 'h2 a', 'h3 a', 'h4 a',
                '.title a', '.post-title a', '.entry-title a', '.article-title a',
                'article a', '.item a', '.cate-content a'
            ];

            // Use a Set to avoid duplicates
            const seenLinks = new Set<string>();

            // Try specific selectors first
            selectors.forEach(sel => {
                $(sel).each((i, el) => {
                    const link = $(el).attr('href');
                    const title = $(el).text().trim();
                    if (link && title && title.length > 10) {
                        // Resolve relative URLs
                        const absoluteLink = new URL(link, url).href;

                        // Basic filter to avoid index/category links
                        if (!seenLinks.has(absoluteLink) && !absoluteLink.endsWith('.html/')) {
                            seenLinks.add(absoluteLink);
                            items.push({
                                title: title,
                                link: absoluteLink,
                                pubDate: new Date().toISOString(),
                                contentSnippet: '',
                                guid: absoluteLink,
                                thumbnail: '',
                                source: sourceName
                            });
                        }
                    }
                });
            });

            if (items.length > 0) {
                console.log(`[RSS Crawler] Scraped ${items.length} items from HTML`);
                return items;
            } else {
                console.log(`[RSS Crawler] No items found with generic HTML scraping.`);
                return [];
            }
        } catch (scrapeError) {
            console.error(`[RSS Crawler] HTML Scrape failed:`, scrapeError);
            return [];
        }
    }

    async fetchContent(url: string, options?: {
        contentSelector?: string | null,
        excludeSelector?: string | null,
        titleSelector?: string | null,
        descriptionSelector?: string | null
    }): Promise<{ content: string, title?: string, description?: string, thumbnail?: string }> {
        try {
            const cheerio = await import('cheerio');
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = await res.text();
            const $ = cheerio.load(html);

            // Generic selector strategy for news sites
            // Remove unwanted elements
            $('script, style, nav, header, footer, .ads, .comments, .related-posts, .menu').remove();
            $('.__mb_article_in_image').remove(); // Remove related news tables (BaoQuocTe specific)

            // Generic selector strategy for news sites
            // Remove unwanted elements
            $('script, style, nav, header, footer, .ads, .comments, .related-posts, .menu').remove();
            $('.__mb_article_in_image').remove(); // Remove related news tables (BaoQuocTe specific)

            if (options?.excludeSelector) {
                $(options.excludeSelector).remove();
                console.log(`[RSS Crawler] Excluded selector:`, options.excludeSelector);
            }

            let content = '';
            let title = '';
            let description = '';
            let thumbnail = '';

            // Extract Thumbnail (Priority: 1. og:image, 2. First image in content)
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) {
                thumbnail = ogImage;
            }

            // Extract Title
            if (options?.titleSelector) {
                title = $(options.titleSelector).first().text().trim();
                // console.log(`[RSS Crawler] Title extracted:`, title?.substring(0, 50));
            }

            // Extract Description
            if (options?.descriptionSelector) {
                description = $(options.descriptionSelector).first().text().trim();
                // console.log(`[RSS Crawler] Description extracted:`, description?.substring(0, 50));
            }

            // Priority 1: Custom User Selector (Supports multiple elements)
            if (options?.contentSelector) {
                const el = $(options.contentSelector);

                if (el.length > 0) {
                    // Concatenate all matched elements
                    el.each((i: number, element: any) => {
                        content += $(element).html() || '';
                    });

                    // If no og:image, try to find first image in content selector
                    if (!thumbnail) {
                        const firstImg = el.find('img').first();
                        const imgSrc = extractRealImageSrc(firstImg);
                        if (imgSrc) thumbnail = imgSrc;
                    }
                }
            }

            // Priority 2: Fallback to common selectors (First match only)
            if (!content) {
                const commonSelectors = [
                    'article',
                    '#content-body',
                    '.article-content-body',
                    '.body-content',
                    '.article-content',
                    '.post-content',
                    '.content-detail',
                    '#content',
                    '.entry-content',
                    '.detail-content',
                    '.main-content'
                ];

                for (const selector of commonSelectors) {
                    const el = $(selector);
                    if (el.length > 0) {
                        content = el.html() || '';

                        // Fallback thumbnail extraction
                        if (!thumbnail) {
                            const firstImg = el.find('img').first();
                            const imgSrc = extractRealImageSrc(firstImg);
                            if (imgSrc) thumbnail = imgSrc;
                        }
                        break;
                    }
                }
            }

            // Final fallback for thumbnail if body extraction failed
            if (!thumbnail) {
                const firstBodyImg = $('article img, .content img').first();
                const imgSrc = extractRealImageSrc(firstBodyImg);
                if (imgSrc) thumbnail = imgSrc;
            }

            // Cleanup content images to ensure src is updated from data-src
            if (content) {
                const temp$ = cheerio.load(content, null, false);
                temp$('img').each((_, img) => {
                    const realSrc = extractRealImageSrc(temp$(img));
                    if (realSrc && realSrc !== temp$(img).attr('src')) {
                        temp$(img).attr('src', realSrc);
                    }
                });
                content = temp$.root().html() || '';
            }

            // Clean up the HTML a bit
            if (content) {
                const clean$ = cheerio.load(content, null, false);
                clean$('a').replaceWith(function () { return clean$(this).html() || clean$(this).text(); }); // MUST use html() to prevent images being destroyed
                clean$('.__mb_article_in_image').remove(); // Extra safety check inside content

                content = clean$.root().html() || '';
            }

            return { content, title, description, thumbnail };
        } catch (error) {
            console.error(`Error scraping ${url}:`, error);
            return { content: '' };
        }
    }
}
