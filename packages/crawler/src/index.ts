import Parser from "rss-parser";
import * as cheerio from "cheerio";

export * from './rss';
export const name = "crawler";

const parser = new Parser();

export async function fetchFeed(url: string) {
    // Helper for HTML scraping
    const scrapeHtml = async (url: string) => {
        console.log(`[Crawler] Starting HTML Scrape for: ${url}`);
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });
            console.log(`[Crawler] HTML Fetch Status: ${res.status}`);

            if (!res.ok) {
                console.error(`[Crawler] Failed to fetch HTML. Status: ${res.status}`);
                return [];
            }

            const html = await res.text();
            const $ = cheerio.load(html);
            const items: any[] = [];

            // Generic logic to find article links in a category page
            // Strategy: Look for headings with links, or specific class names often used for titles
            const selectors = [
                'h1 a', 'h2 a', 'h3 a', 'h4 a',
                '.title a', '.post-title a', '.entry-title a', '.article-title a',
                'article a', '.item a', '.cate-content a'
            ];

            // Use a Set to avoid duplicates
            const seenLinks = new Set<string>();

            // 1. Try specific selectors first
            selectors.forEach(sel => {
                $(sel).each((i, el) => {
                    const link = $(el).attr('href');
                    const title = $(el).text().trim();
                    if (link && title && title.length > 10) { // filter out short/nav links
                        // Resolve relative URLs
                        const absoluteLink = new URL(link, url).href;

                        // Basic filter to avoid index/category links (simple heuristic)
                        const isArticle = absoluteLink.match(/\.(html|htm)(\?.*)?$/i)
                            || absoluteLink.match(/\/[a-z0-9\-]+\-\d+(\?.*)?$/i); // slug-12345

                        const isBlacklisted = absoluteLink.match(/(\.topic|\/chu-de\/|\/tag\/|\/category\/|\/danh-muc\/|\/su-kien\/)/i);

                        if (!seenLinks.has(absoluteLink) && !absoluteLink.endsWith('.html/') && !isBlacklisted) {
                            // If strictly enforcing .html for known sites, we could do more. 
                            // But for now, just exclude known bad patterns.
                            seenLinks.add(absoluteLink);
                            items.push({
                                title: title,
                                link: absoluteLink,
                                pubDate: new Date().toISOString(), // No date in list usually
                                contentSnippet: '' // No snippet in simple scrape
                            });
                        }
                    }
                });
            });

            if (items.length > 0) {
                console.log(`[Crawler] Scraped ${items.length} items from HTML`);
                return items;
            } else {
                console.log(`[Crawler] No items found with generic HTML scraping.`);
                return [];
            }
        } catch (scrapeError) {
            console.error(`[Crawler] HTML Scrape failed:`, scrapeError);
            return [];
        }
    };

    try {
        console.log(`[Crawler] Parsing RSS: ${url}`);
        const feed = await parser.parseURL(url);

        if (!feed.items || feed.items.length === 0) {
            console.log(`[Crawler] RSS parsed successfully but found 0 items. Fallback to HTML scraping.`);
            return await scrapeHtml(url);
        }

        console.log(`[Crawler] Parsed ${feed.items.length} items from ${url}`);
        return feed.items;
    } catch (error) {
        console.log(`[Crawler] RSS Parse failed/empty. Trying HTML Scrape.`);
        return await scrapeHtml(url);
    }
}

export async function fetchContent(url: string, options?: {
    contentSelector?: string | null,
    excludeSelector?: string | null,
    titleSelector?: string | null,
    descriptionSelector?: string | null
}): Promise<{ content: string, title?: string, description?: string, thumbnail?: string }> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache'
            }
        });
        const html = await res.text();
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $('script, style, nav, header, footer, .ads, .comments, .related-posts, .menu').remove();
        $('.__mb_article_in_image').remove();

        if (options?.excludeSelector) {
            $(options.excludeSelector).remove();
        }

        let content = '';
        let title = '';
        let description = '';
        let thumbnail = '';

        // Extract og:image thumbnail
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) thumbnail = ogImage;

        // Extract Title
        if (options?.titleSelector) {
            title = $(options.titleSelector).first().text().trim();
        }

        // Extract Description
        if (options?.descriptionSelector) {
            description = $(options.descriptionSelector).first().text().trim();
        }

        // Helper to extract real image src (handles data-src lazy load)
        const extractRealSrc = (el: any): string => {
            return $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('data-lazy-src') || $(el).attr('src') || '';
        };

        // Priority 1: Custom User Selector
        if (options?.contentSelector) {
            const el = $(options.contentSelector);
            if (el.length > 0) {
                el.each((i: number, element: any) => {
                    content += $(element).html() || '';
                });
                if (!thumbnail) {
                    const firstImg = el.find('img').first();
                    const src = extractRealSrc(firstImg);
                    if (src) thumbnail = src;
                }
            }
        }

        // Priority 2: Fallback to common selectors
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
                '.article-detail',
                '.main-content'
            ];

            for (const selector of commonSelectors) {
                const el = $(selector);
                if (el.length > 0) {
                    content = el.html() || '';
                    if (!thumbnail) {
                        const firstImg = el.find('img').first();
                        const src = extractRealSrc(firstImg);
                        if (src) thumbnail = src;
                    }
                    break;
                }
            }
        }

        // Clean up: unwrap links but PRESERVE nested img tags
        if (content) {
            const clean$ = cheerio.load(content, null, false);
            clean$('a').each((_: number, el: any) => {
                const inner = clean$(el).html() || '';
                clean$(el).replaceWith(inner);
            });
            clean$('.__mb_article_in_image').remove();
            content = clean$.root().html() || '';
        }

        return { content, title, description, thumbnail };
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return { content: '' };
    }
}

