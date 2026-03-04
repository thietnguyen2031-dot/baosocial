import { db } from "@packages/db";

export async function sendToWebhook(article: any) {
    try {
        const webhookSetting = await db.query.systemSettings.findFirst({
            where: (s, { eq }) => eq(s.key, "social_webhook_url")
        });

        if (!webhookSetting || !webhookSetting.value) return;

        const webhookUrl = webhookSetting.value;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.benthanhmedia.net';
        const articleUrl = `${siteUrl}/tin/${article.slug || article.id}`;

        console.log(`[Webhook] 📤 Sending to Make.com/Zapier for POST: ${article.title}`);

        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: article.id,
                title: article.title,
                summary: article.summary,
                url: articleUrl,
                thumbnail: article.thumbnail,
                publishedAt: article.publishedAt
            })
        });

        if (res.ok) {
            console.log(`[Webhook] ✅ Successfully sent!`);
        } else {
            console.log(`[Webhook] ❌ Failed to send: ${res.statusText}`);
        }
    } catch (err) {
        console.error(`[Webhook] ❌ Error:`, err);
    }
}
