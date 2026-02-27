
import { db, articles, systemSettings } from "@packages/db";
import { eq } from "drizzle-orm";
import { rewriteContent, generateSEOSuggestions } from "@packages/ai";
import { notifyNewArticle } from "./telegram-bot"; // Will implement next

export async function processNewArticle(articleId: number) {
    console.log(`🤖 [AI Pipeline] Processing Article ID: ${articleId}...`);

    try {
        // 1. Fetch Article
        const article = await db.query.articles.findFirst({
            where: (a, { eq }) => eq(a.id, articleId)
        });

        if (!article) {
            console.error(`❌ [AI Pipeline] Article ${articleId} not found.`);
            return;
        }

        // 2. Fetch API Keys
        const keySetting = await db.query.systemSettings.findFirst({
            where: (s, { eq }) => eq(s.key, "gemini_api_keys")
        });

        let keys: string[] = [];
        if (keySetting && keySetting.value) {
            keys = keySetting.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k);
        }

        if (keys.length === 0) {
            console.warn("⚠️ [AI Pipeline] No Gemini API keys found. Skipping AI processing.");
            // Still notify Telegram even if AI fails? Yes.
            await notifyNewArticle(article);
            return;
        }

        // 3. Rewrite Content (if content exists)
        let newContent = article.contentAi || "";
        if (article.contentAi) {
            console.log("✍️ [AI Pipeline] Rewriting content...");
            try {
                newContent = await rewriteContent(article.contentAi, keys);
            } catch (e) {
                console.error("❌ [AI Pipeline] Rewrite failed:", e);
                // Continue with original content
            }
        }

        // 4. Generate SEO (if title/content exists)
        let seoUpdate = {};
        if (article.title && newContent) {
            console.log("🎯 [AI Pipeline] Generating SEO...");
            try {
                const seo = await generateSEOSuggestions(article.title, newContent, keys);
                seoUpdate = {
                    seoTitle: seo.title,
                    seoDescription: seo.description,
                    focusKeyword: seo.keywords,
                    slug: seo.slug // Auto-update slug? Maybe risky if external links rely on it? 
                    // But for new articles it is fine.
                    // The crawler sync logic sets a timestamp-based slug initially.
                    // SEO slug is better.
                };
            } catch (e) {
                console.error("❌ [AI Pipeline] SEO generation failed:", e);
            }
        }

        // 5. Update DB
        await db.update(articles)
            .set({
                contentAi: newContent,
                ...seoUpdate,
                // Status remains PENDING until Telegram approval
            })
            .where(eq(articles.id, articleId));

        console.log("✅ [AI Pipeline] Article updated with AI content.");

        // 6. Notify Telegram
        // Fetch updated article to send correct data
        const updatedArticle = await db.query.articles.findFirst({
            where: (a, { eq }) => eq(a.id, articleId)
        });

        if (updatedArticle) {
            await notifyNewArticle(updatedArticle);
        }

    } catch (error) {
        console.error("❌ [AI Pipeline] Critical Error:", error);
    }
}
