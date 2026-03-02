
import { db, articles, systemSettings, rssFeeds } from "@packages/db";
import { eq } from "drizzle-orm";
import { rewriteContent, generateSEOSuggestions } from "@packages/ai";
import { notifyNewArticle } from "./telegram-bot";

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

        // 2. Fetch Settings (API Keys + Telegram Mode)
        const [keySetting, telegramSetting] = await Promise.all([
            db.query.systemSettings.findFirst({ where: (s, { eq }) => eq(s.key, "gemini_api_keys") }),
            db.query.systemSettings.findFirst({ where: (s, { eq }) => eq(s.key, "telegram_approval_enabled") })
        ]);

        const isTelegramApproval = telegramSetting?.value === "true";

        let keys: string[] = [];
        if (keySetting?.value) {
            keys = keySetting.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k);
        }

        // 3. Determine if this feed has autoSeo ON
        // If no keys, skip AI but still handle Telegram/status
        let aiSuccess = false;
        let newContent = article.contentAi || "";
        let seoUpdate: Record<string, any> = {};

        if (keys.length === 0) {
            console.warn("⚠️ [AI Pipeline] No Gemini API keys found. Skipping AI.");
        } else if (!article.contentAi || article.contentAi.length < 50) {
            console.warn(`⚠️ [AI Pipeline] Article ${articleId} has no/short content. Skipping AI.`);
        } else {
            // 4. Run Auto SEO (rewrite + SEO in one call = cheaper)
            console.log("🎯 [AI Pipeline] Running Auto SEO...");
            try {
                const seo = await generateSEOSuggestions(article.title, article.contentAi, keys);
                newContent = seo.rewrittenContent || newContent;
                seoUpdate = {
                    title: seo.suggestedTitle,
                    seoTitle: seo.suggestedTitle,
                    seoDescription: seo.metaDescription,
                    slug: seo.slug,
                    summary: seo.metaDescription,
                };
                aiSuccess = true;
                console.log(`✅ [AI Pipeline] AI SEO done: "${seo.suggestedTitle.substring(0, 50)}"`);
            } catch (e) {
                console.error("❌ [AI Pipeline] AI SEO failed:", e);
            }
        }

        // 5. Determine final status
        // - Telegram = ON → always PENDING (wait for manual approval)
        // - Telegram = OFF → PUBLISHED if AI succeeded, PENDING if AI failed
        const newStatus = isTelegramApproval
            ? "PENDING"
            : (aiSuccess ? "PUBLISHED" : "PENDING");

        console.log(`📋 [AI Pipeline] Status → ${newStatus} (telegram: ${isTelegramApproval}, aiSuccess: ${aiSuccess})`);

        // 6. Update DB
        await db.update(articles)
            .set({
                contentAi: newContent,
                ...seoUpdate,
                status: newStatus,
                publishedAt: newStatus === "PUBLISHED" ? new Date() : article.publishedAt,
            })
            .where(eq(articles.id, articleId));

        console.log(`✅ [AI Pipeline] Article ${articleId} updated → ${newStatus}`);

        // 7. Notify Telegram (if enabled, for approval flow)
        if (isTelegramApproval) {
            const updatedArticle = await db.query.articles.findFirst({
                where: (a, { eq }) => eq(a.id, articleId)
            });
            if (updatedArticle) {
                await notifyNewArticle(updatedArticle);
            }
        }

    } catch (error) {
        console.error("❌ [AI Pipeline] Critical Error:", error);
    }
}

