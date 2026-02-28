import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();


// --- Global API Key Manager ---
interface KeyState {
    lastUsed: number;
    inUse: boolean;
    disabledUntil: number;
    gemini3ExhaustedUntil: number;
    gemini25ExhaustedUntil: number;
}
const keyStates = new Map<string, KeyState>();

function getNextResetTimeMs(): number {
    const now = new Date();
    // Midnight PT is 08:00 UTC (15:00 GMT+7)
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0, 0));
    if (now.getTime() >= reset.getTime()) {
        reset.setUTCDate(reset.getUTCDate() + 1);
    }
    return reset.getTime();
}

async function acquireKey(validKeys: string[]): Promise<string> {
    validKeys.forEach(k => {
        if (!keyStates.has(k)) keyStates.set(k, { lastUsed: 0, inUse: false, disabledUntil: 0, gemini3ExhaustedUntil: 0, gemini25ExhaustedUntil: 0 });
    });

    while (true) {
        let bestKey: string | null = null;
        let oldestTime = Infinity;
        const now = Date.now();

        // Find the available key with the oldest lastUsed time and not disabled
        for (const key of validKeys) {
            const state = keyStates.get(key)!;
            // Clear disabled flag if the time has passed
            if (state.disabledUntil > 0 && now > state.disabledUntil) state.disabledUntil = 0;
            if (state.gemini3ExhaustedUntil > 0 && now > state.gemini3ExhaustedUntil) state.gemini3ExhaustedUntil = 0;
            if (state.gemini25ExhaustedUntil > 0 && now > state.gemini25ExhaustedUntil) state.gemini25ExhaustedUntil = 0;

            const isExhausted = state.gemini3ExhaustedUntil > 0 && state.gemini25ExhaustedUntil > 0;

            if (!state.inUse && state.disabledUntil === 0 && !isExhausted && state.lastUsed < oldestTime) {
                oldestTime = state.lastUsed;
                bestKey = key;
            }
        }

        if (bestKey) {
            const state = keyStates.get(bestKey)!;
            const timeSinceLastUse = now - state.lastUsed;
            const COOLDOWN_MS = 60000; // 1 minute

            if (timeSinceLastUse < COOLDOWN_MS) {
                const waitTime = COOLDOWN_MS - timeSinceLastUse;
                console.log(`⏳ [AI] Key [${bestKey}] is cooling down. Waiting ${Math.round(waitTime / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            // Mark as in use and update time
            state.inUse = true;
            state.lastUsed = Date.now();
            return bestKey;
        }

        // Wait if all keys are busy (e.g. processing other articles concurrently)
        console.log(`⏳ [AI] All keys are currently in use or exhausted. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

function releaseKey(key: string, targetModel?: string, error?: any) {
    const state = keyStates.get(key);
    if (state) {
        state.inUse = false;
        state.lastUsed = Date.now(); // Start cooldown AFTER it finishes

        // Handle Quota and Rate Limit Errors
        if (error) {
            const msg = error.message || "";
            if (msg.includes("429") || msg.includes("Quota") || msg.includes("RESOURCE_EXHAUSTED")) {
                const nextReset = getNextResetTimeMs();

                if (targetModel && targetModel.includes("gemini-3")) {
                    state.gemini3ExhaustedUntil = nextReset;
                    console.log(`🛑 [AI] Key [${key}] exhausted for ${targetModel}. Disabled until 15:00 GMT+7.`);
                } else if (targetModel && targetModel.includes("gemini-2.5")) {
                    state.gemini25ExhaustedUntil = nextReset;
                    console.log(`🛑 [AI] Key [${key}] exhausted for ${targetModel}. Disabled until 15:00 GMT+7.`);
                } else {
                    let waitMs = 60000; // Default 1 minute penalty for 429
                    // Try to extract retry delay from error message (e.g. "Please retry in 46.58s")
                    const retryMatch = msg.match(/retry in ([\d\.]+)s/i);
                    if (retryMatch && retryMatch[1]) {
                        waitMs = (parseFloat(retryMatch[1]) + 2) * 1000; // Add 2s padding
                    }
                    state.disabledUntil = Date.now() + waitMs;
                    console.log(`⏳ [AI] Key [${key}] rate limited. Disabled for ${Math.round(waitMs / 1000)}s.`);
                }
            } else {
                state.disabledUntil = Date.now() + 60000;
                console.log(`⏳ [AI] Key [${key}] errored (non-quota). Disabled for 60s.`);
            }
        }
    }
}


export async function rewriteContent(content: string, apiKeys: string[] = []): Promise<string> {
    // Only fallback to env if apiKeys was NOT provided (default empty array)
    // If apiKeys is explicitly passed (even empty), it means caller wants DB-only
    const useEnvFallback = apiKeys.length === 0;
    const keys = useEnvFallback ? [process.env.GEMINI_API_KEY || ""] : apiKeys;
    const validKeys = keys.filter(k => k && k.trim() !== "");

    console.log(`🔍 [AI] Received ${apiKeys.length} keys from caller, using env fallback: ${useEnvFallback}`);
    console.log(`🔍 [AI] Valid keys after filter: ${validKeys.length}`, validKeys.map(k => `...${k.slice(-8)}`));

    if (validKeys.length === 0) {
        throw new Error("No valid Gemini API keys provided.");
    }

    // CRITICAL DEBUG: Log which keys we're actually using
    console.log(`🔍 [AI] ========== API KEY DEBUG ==========`);
    console.log(`🔍 [AI] useEnvFallback: ${useEnvFallback}`);
    console.log(`🔍 [AI] apiKeys parameter length: ${apiKeys.length}`);
    console.log(`🔍 [AI] validKeys count: ${validKeys.length}`);
    console.log(`🔍 [AI] ENV key (.env): ${process.env.GEMINI_API_KEY ? `...${process.env.GEMINI_API_KEY.slice(-8)}` : 'NOT SET'}`);
    validKeys.forEach((k, idx) => {
        console.log(`🔍 [AI] Key ${idx + 1}: ...${k.slice(-8)} (length: ${k.length})`);
    });
    console.log(`🔍 [AI] ======================================`);

    const prompt = `
    Bạn là một biên tập viên báo chí chuyên nghiệp. Hãy viết lại nội dung tin tức sau đây:
    
    YÊU CẦU NỘI DUNG:
    1. Giữ nguyên ý nghĩa cốt lõi và các số liệu quan trọng.
    2. Thay đổi cách diễn đạt để tránh đạo văn (plagiarism-free).
    3. Sử dụng văn phong báo chí: khách quan, súc tích, lôi cuốn.
    4. Viết bằng TIẾNG VIỆT hoàn toàn.
    
    YÊU CẦU ĐỊNH DẠNG HTML:
    - Sử dụng <h2> cho tiêu đề chính của các phần
    - Sử dụng <h3> cho tiêu đề phụ nếu cần
    - Mỗi đoạn văn trong thẻ <p>, không để trống
    - Sử dụng <strong> hoặc <b> để làm nổi bật từ khóa, con số quan trọng
    - Sử dụng <ul> và <li> cho danh sách liệt kê
    - Sử dụng <table> với <thead>, <tbody>, <tr>, <th>, <td> nếu có dữ liệu dạng bảng
    - BẮT BUỘC GIỮ NGUYÊN toàn bộ thẻ <img src="..."> (hình ảnh) trong bài viết, tuyệt đối không được xóa
    - KHÔNG sử dụng thẻ <div>, <span> hoặc class/style inline
    - Trả về CHÍNH XÁC mã HTML thuần túy, KHÔNG có markdown, KHÔNG có \`\`\`html wrapper
    
    Nội dung gốc:
    ${content}
    `;

    let lastError = null;
    let attempts = 0;
    const maxAttempts = validKeys.length * 2; // Allow 2 attempts per key (for both models)

    // Retry with rotation via KeyManager
    while (attempts < maxAttempts) {
        const key = await acquireKey(validKeys);
        const state = keyStates.get(key)!;

        let targetModel = "gemini-3-flash";
        if (state.gemini3ExhaustedUntil > 0 && state.gemini25ExhaustedUntil === 0) {
            targetModel = "gemini-2.5-flash";
        }

        try {
            console.log(`🤖 [AI] Attempting with key: [${key}] - Model: ${targetModel}`);
            const ai = new GoogleGenAI({ apiKey: key });

            const isGemini3 = targetModel.includes("gemini-3");
            const configParams: any = isGemini3 ? { thinkingConfig: { thinkingLevel: "low" } } : {};

            const response = await ai.models.generateContent({
                model: targetModel,
                contents: prompt,
                config: configParams
            });
            let html = response.text || "";

            // Strip markdown code fence and literal \n sequences
            html = html
                .replace(/^```html\s*/i, '')
                .replace(/\s*```$/i, '')
                .replace(/\\n/g, ' ')
                .replace(/\n/g, ' ')
                .trim();

            console.log(`✅ [AI] Success with key: [${key}] - Model: ${targetModel}`);
            releaseKey(key);
            return html;
        } catch (error: any) {
            console.error(`⚠️ [AI] Key [${key}] - Model: ${targetModel} failed:`, error.message);
            lastError = error;
            releaseKey(key, targetModel, error);
            attempts++;
            // Continue to next attempt
        }
    }

    throw lastError || new Error("All API keys failed.");
}

export interface SEOSuggestions {
    suggestedTitle: string;
    metaDescription: string;
    slug: string;
    rewrittenContent: string;
}

export async function generateSEOSuggestions(
    title: string,
    content: string,
    apiKeys: string[] = []
): Promise<SEOSuggestions> {
    const useEnvFallback = apiKeys.length === 0;
    const keys = useEnvFallback ? [process.env.GEMINI_API_KEY || ""] : apiKeys;
    const validKeys = keys.filter(k => k && k.trim() !== "");

    console.log(`🔍 [AI SEO] Processing with ${validKeys.length} keys`);

    if (validKeys.length === 0) {
        throw new Error("No valid Gemini API keys provided.");
    }

    const prompt = `
    Bạn là một chuyên gia SEO và biên tập viên báo chí. Hãy tối ưu bài viết sau cho SEO.
    
    TIÊU ĐỀ GỐC: ${title}
    NỘI DUNG GỐC: ${content}
    
    YÊU CẦU:
    Trả về JSON với cấu trúc SAU (PHẢI là JSON hợp lệ, KHÔNG có markdown wrapper):
    {
        "suggestedTitle": "Tiêu đề tối ưu SEO (50-60 ký tự, có từ khóa chính)",
        "metaDescription": "Mô tả hấp dẫn (140-160 ký tự, kêu gọi hành động)",
        "slug": "url-thân-thiện-seo-3-5-tu",
        "rewrittenContent": "Nội dung HTML đã viết lại"
    }
    
    QUY TẮC CHO suggestedTitle:
    - BẮT BUỘC DƯỚI 65 KÝ TỰ (Tuyệt đối không được dài hơn).
    - Ngắn gọn, súc tích, đi thẳng vào vấn đề chính.
    - Chứa từ khóa chính ở đầu.
    - Thu hút click.
    - Không dùng ký tự đặc biệt.
    
    QUY TẮC CHO metaDescription:
    - BẮT BUỘC TỪ 140 ĐẾN TỐI ĐA 155 KÝ TỰ (Không được vượt quá 160 ký tự).
    - Tóm tắt lôi cuốn, bao quát nội dung.
    - Có call-to-action nhẹ.
    
    QUY TẮC CHO slug:
    - Chỉ dùng chữ thường, số, dấu gạch ngang
    - 3-5 từ quan trọng
    - Ví dụ: "cap-nhat-ty-gia-techcombank"
    
    QUY TẮC CHO rewrittenContent:
    - BẮT BUỘC phải viết lại toàn bộ nội dung bằng văn phong và từ ngữ mới (để tránh đạo văn - plagiarism-free).
    - KHÔNG copy y nguyên bản gốc. Thay đổi cấu trúc câu, cách diễn đạt nhưng giữ nguyên ý nghĩa cốt lõi.
    - Giữ nguyên số liệu, tên riêng, và sự kiện chính.
    - Định dạng HTML thuần túy (h2, h3, p, strong, ul, li, table).
    - BẮT BUỘC GIỮ NGUYÊN toàn bộ thẻ <img src="..."> (hình ảnh) trong bài viết gốc nếu có.
    - Phải chia đoạn và có cấu trúc heading rõ ràng dễ đọc.
    - Văn phong báo chí chuyên nghiệp, lôi cuốn.
    - KHÔNG có wrapper \`\`\`html.
    
    LƯU Ý QUAN TRỌNG VỀ ĐỊNH DẠNG JSON TRẢ VỀ:
    - BẠN BẮT BUỘC PHẢI TRẢ VỀ DỮ LIỆU JSON ĐÃ ĐƯỢC CHUẨN HÓA THÀNH MỘT DÒNG DUY NHẤT (MINIFIED JSON).
    - TUYỆT ĐỐI KHÔNG SỬ DỤNG KÝ TỰ XUỐNG DÒNG (\n) HAY KHOẢNG TRỂN (TAB) THẬT SỰ Ở BẤT CỨ ĐÂU TRONG CHUỖI JSON ĐẦU RA. BẠN PHẢI ESCAPE CHÚNG (VD: \\n, \\t).
    
    Tóm lại: Trả về JSON hợp lệ trên một dòng duy nhất.
    `;

    let lastError = null;
    let attempts = 0;
    const maxAttempts = validKeys.length * 2; // Allow 2 attempts per key (for both models)

    while (attempts < maxAttempts) {
        const key = await acquireKey(validKeys);
        const state = keyStates.get(key)!;

        let targetModel = "gemini-3-flash";
        if (state.gemini3ExhaustedUntil > 0 && state.gemini25ExhaustedUntil === 0) {
            targetModel = "gemini-2.5-flash";
        }

        try {
            console.log(`🤖 [AI SEO] Attempting with key: [${key}] - Model: ${targetModel}`);
            const ai = new GoogleGenAI({ apiKey: key });

            const isGemini3 = targetModel.includes("gemini-3");
            const configParams: any = isGemini3 ? { thinkingConfig: { thinkingLevel: "low" } } : {};

            const response = await ai.models.generateContent({
                model: targetModel,
                contents: prompt,
                config: configParams
            });
            let text = response.text || "";

            // Strip markdown code fence if present
            text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

            // Try to extract just the JSON object to ignore conversational padding
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                text = text.substring(startIdx, endIdx + 1);
            }

            // Parse JSON
            let parsed: SEOSuggestions;
            try {
                // First pass Parse
                parsed = JSON.parse(text) as SEOSuggestions;
            } catch (e: any) {
                console.log("⚠️ [AI SEO] First pass JSON parse failed, attempting strict cleanup. Error:", e.message);
                // If the LLM failed to minify and left literal newlines/tabs inside string values,
                // Replace all literal newlines, carriage returns, and tabs with a single space.
                // This preserves JSON structure while slightly modifying whitespace in the content.
                // We also remove potential trailing commas that break JSON.parse
                text = text.replace(/[\n\r\t]+/g, " ");
                text = text.replace(/,(?=\s*[\}\]])/g, ""); // Remove trailing commas
                parsed = JSON.parse(text) as SEOSuggestions;
            }

            // Second pass: sanitize \n from rewritten content
            if (parsed.rewrittenContent) {
                parsed.rewrittenContent = parsed.rewrittenContent
                    .replace(/\\n/g, ' ')
                    .replace(/\n/g, ' ')
                    .trim();
            }

            console.log(`✅ [AI SEO] Success:`, {
                title: parsed.suggestedTitle.substring(0, 50),
                descLength: parsed.metaDescription.length,
                slug: parsed.slug
            });

            releaseKey(key);
            return parsed;
        } catch (error: any) {
            console.error(`⚠️ [AI SEO] Key [${key}] - Model: ${targetModel} failed:`, error.message);
            lastError = error;
            releaseKey(key, targetModel, error);
            attempts++;
        }
    }

    throw lastError || new Error("All API keys failed for SEO suggestions.");
}
