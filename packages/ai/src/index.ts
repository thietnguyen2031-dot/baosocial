import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();


// --- Global API Key Manager ---
interface KeyState {
    lastUsed: number;
    inUse: boolean;
}
const keyStates = new Map<string, KeyState>();

async function acquireKey(validKeys: string[]): Promise<string> {
    validKeys.forEach(k => {
        if (!keyStates.has(k)) keyStates.set(k, { lastUsed: 0, inUse: false });
    });

    while (true) {
        let bestKey: string | null = null;
        let oldestTime = Infinity;

        // Find the available key with the oldest lastUsed time
        for (const key of validKeys) {
            const state = keyStates.get(key)!;
            if (!state.inUse && state.lastUsed < oldestTime) {
                oldestTime = state.lastUsed;
                bestKey = key;
            }
        }

        if (bestKey) {
            const state = keyStates.get(bestKey)!;
            const now = Date.now();
            const timeSinceLastUse = now - state.lastUsed;
            const COOLDOWN_MS = 60000; // 1 minute

            if (timeSinceLastUse < COOLDOWN_MS) {
                const waitTime = COOLDOWN_MS - timeSinceLastUse;
                console.log(`⏳ [AI] Key ...${bestKey.slice(-8)} is cooling down. Waiting ${Math.round(waitTime / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            // Mark as in use and update time
            state.inUse = true;
            state.lastUsed = Date.now();
            return bestKey;
        }

        // Wait if all keys are busy (e.g. processing other articles concurrently)
        console.log(`⏳ [AI] All keys are currently in use. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

function releaseKey(key: string) {
    const state = keyStates.get(key);
    if (state) {
        state.inUse = false;
        state.lastUsed = Date.now(); // Start 1-min cooldown AFTER it finishes
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
    const maxAttempts = validKeys.length;

    // Retry with rotation via KeyManager
    while (attempts < maxAttempts) {
        const key = await acquireKey(validKeys);
        try {
            console.log(`🤖 [AI] Attempting with key: ...${key.slice(-8)}`);
            const ai = new GoogleGenAI({ apiKey: key });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    thinkingConfig: {
                        thinkingLevel: "low" as any // Workaround cho TS lỗi enum, document ghi nhận
                    }
                }
            });
            let html = response.text || "";

            // Strip markdown code fence and literal \n sequences
            html = html
                .replace(/^```html\s*/i, '')
                .replace(/\s*```$/i, '')
                .replace(/\\n/g, ' ')
                .replace(/\n/g, ' ')
                .trim();

            console.log(`✅ [AI] Success with key: ...${key.slice(-8)}`);
            releaseKey(key);
            return html;
        } catch (error: any) {
            console.error(`⚠️ [AI] Key ...${key.slice(-4)} failed:`, error.message);
            lastError = error;
            releaseKey(key);
            attempts++;
            // Continue to next key
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
    const maxAttempts = validKeys.length;

    while (attempts < maxAttempts) {
        const key = await acquireKey(validKeys);
        try {
            console.log(`🤖 [AI SEO] Attempting with key: ...${key.slice(-8)}`);
            const ai = new GoogleGenAI({ apiKey: key });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    thinkingConfig: {
                        thinkingLevel: "low" as any
                    }
                }
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
            console.error(`⚠️ [AI SEO] Key ...${key.slice(-4)} failed:`, error.message);
            lastError = error;
            releaseKey(key);
            attempts++;
        }
    }

    throw lastError || new Error("All API keys failed for SEO suggestions.");
}
