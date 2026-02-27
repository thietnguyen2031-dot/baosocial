
import TelegramBot from "node-telegram-bot-api";
import { db, systemSettings, articles } from "@packages/db";
import { eq } from "drizzle-orm";

let bot: TelegramBot | null = null;
let isInitializing = false;

// Initialize Bot from DB Settings
export async function initTelegramBot() {
    if (bot || isInitializing) return bot;
    isInitializing = true;

    try {
        const settings = await db.query.systemSettings.findFirst({
            where: (s, { eq }) => eq(s.key, "telegram_config")
        });

        if (!settings || !settings.value) {
            console.log("⚠️ [Telegram] No config found. Bot not started.");
            isInitializing = false;
            return null;
        }

        const config = JSON.parse(settings.value);
        if (!config.token) {
            console.log("⚠️ [Telegram] No token found.");
            isInitializing = false;
            return null;
        }

        bot = new TelegramBot(config.token, { polling: true });
        console.log("🤖 [Telegram] Bot started!");

        // Handle Errors
        bot.on("polling_error", (error) => {
            console.error("❌ [Telegram] Polling Error:", error.message); // Quieter logs
        });

        // Handle /approve_{id} command or Callback Query
        bot.on("callback_query", async (query) => {
            if (!query.data) return;

            const chatId = query.message?.chat.id;
            const messageId = query.message?.message_id;

            if (query.data.startsWith("approve_")) {
                const articleId = parseInt(query.data.split("_")[1]);
                await handleApprove(articleId, chatId!, messageId!);

                // Answer query to stop loading animation
                bot?.answerCallbackQuery(query.id, { text: "Đã duyệt bài viết!" });
            }
        });

        isInitializing = false;
        return bot;

    } catch (error) {
        console.error("❌ [Telegram] Init Failed:", error);
        isInitializing = false;
        return null;
    }
}

async function handleApprove(articleId: number, chatId: number, messageId: number) {
    console.log(`✅ [Telegram] Approving article ${articleId}...`);

    // Update DB
    await db.update(articles)
        .set({ status: "PUBLISHED" })
        .where(eq(articles.id, articleId));

    // Edit Message to show Approved status
    if (bot) {
        try {
            await bot.editMessageCaption("✅ *BÀI VIẾT ĐÃ ĐƯỢC DUYỆT!*", {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown"
            });
        } catch (e) {
            console.error("⚠️ [Telegram] Failed to edit message:", e);
        }
    }
}

export async function notifyNewArticle(article: any) {
    const initializedBot = await initTelegramBot();
    if (!initializedBot) return;

    try {
        // Get Routing Config
        const settings = await db.query.systemSettings.findFirst({
            where: (s, { eq }) => eq(s.key, "telegram_config")
        });
        const config = settings?.value ? JSON.parse(settings.value) : {};

        let targetChatId = config.defaultChatId;

        // Routing by Category
        if (config.routing && article.category && config.routing[article.category]) {
            targetChatId = config.routing[article.category];
        }

        if (!targetChatId) {
            console.warn("⚠️ [Telegram] No target Chat ID found for notification.");
            return;
        }

        const caption = `
📢 *TIN MỚI CẦN DUYỆT*
-------------------------
📝 *${article.title}*

📂 Chuyên mục: #${article.category?.replace(/\s+/g, "_")}
📅 Lúc: ${new Date(article.publishedAt).toLocaleString("vi-VN")}
-------------------------
*AI Summary:*
${article.summary || "No summary"}
`;

        const opts: TelegramBot.SendMessageOptions = {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ DUYỆT BÀI NGAY", callback_data: `approve_${article.id}` }
                    ],
                    [
                        { text: "🔗 Xem nguồn", url: article.sourceUrl || "https://google.com" }
                    ]
                ]
            }
        };

        if (article.thumbnail) {
            await initializedBot.sendPhoto(targetChatId, article.thumbnail, {
                caption: caption,
                ...opts
            });
        } else {
            await initializedBot.sendMessage(targetChatId, caption, opts);
        }

        console.log(`📨 [Telegram] Notification sent to ${targetChatId}`);

    } catch (error) {
        console.error("❌ [Telegram] Send Failed:", error);
    }
}
