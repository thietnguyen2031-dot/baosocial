---
name: "Skill: Tích hợp Gemini API (2.5 & 3.0)"
description: Hướng dẫn tích hợp Gemini API (Model 2.5 & 3.0) chuẩn xác bằng SDK mới
---

# 🤖 Skill: Tích hợp Gemini API (2.5 & 3.0)

> **MỤC ĐÍCH:** Hướng dẫn cách gọi Gemini API cho các Model mới nhất (2.5 và 3.0), cách xử lý lỗi treo SDK và cú pháp chính xác với package `@google/genai`.

## ⚠️ CẢNH BÁO QUAN TRỌNG (CRITICAL)

1. **KHÔNG SỬ DỤNG SDK CŨ:** Tuyệt đối **không** dùng package `@google/generative-ai`. Package này gây lỗi treo (hang) hoặc timeout ngầm khi gọi các model từ bản 2.5 trở lên.
2. **MODEL DEPRECATED:** Model `gemini-2.0-flash` đã bị Google khai tử. KHÔNG sử dụng trong code mới.

Phải luôn sử dụng: **`@google/genai`**

## 📦 Cài đặt

Sử dụng lệnh sau để cài đặt (nhớ thay đổi workspace nếu áp dụng cấu trúc monorepo):

```bash
npm install @google/genai
```

## 🧠 Các Model Hỗ trợ & Khuyên dùng

| Model Name                 | Phiên bản | Ghi chú                                                                                     |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `gemini-3-flash-preview`   | 3.0       | **Được ưu tiên nhất.** Dùng cho tài khoản Tier 1, có free tier, mạnh mẽ, nhanh nhạy.         |
| `gemini-3.1-pro-preview`   | 3.1 Pro   | Model thông minh nhất, nhưng không có free tier ở mức API (chỉ dùng trả phí).                |
| `gemini-2.5-flash`         | 2.5       | Dùng thay thế 2.0. Chú ý model này tự động bật cấu hình "Thinking" gây tốn token và bị chậm. |
| `gemini-2.5-flash-lite`    | 2.5       | Bản rút gọn. Ít tốn kém hơn nhưng khả năng reasoning hạn chế.                               |

## 🛠️ Hướng dẫn Khởi tạo & Lỗi "Thinking Mode"

Các model 2.5 và 3.0 có tính năng "Thinking Mode" (Suy nghĩ trước khi trả lời). Nếu không cấu hình, API sẽ mặc định bật mức cao (hoặc xảy ra xung đột với TypeScript client), gây ra hiện tượng:
- Treo request vô thời hạn (không quăng lỗi).
- Tiêu tốn cực kỳ nhiều token (Quota Exceeded).

### Cách xử lý
Luôn truyền `thinkingConfig` với `thinkingLevel: "low"` khi gọi API với các kịch bản chung (Ví dụ: rewrite, summary) để tiết kiệm và giảm độ trễ. 

*\*Lưu ý: Do type definition của `@google/genai` (bản hiện hành) chưa cập nhật hoàn chỉnh enum cho `thinkingConfig`, bạn có thể phải dùng workaround `as any` trong TypeScript.*

## 💻 Mã Nguồn Chuẩn (Code Snippets)

Dưới đây là đoạn code mẫu chuẩn để khởi tạo và gọi Generative Content:

```typescript
import { GoogleGenAI } from "@google/genai";

// 1. Khởi tạo client (Lưu ý class là GoogleGenAI chứ không phải GoogleGenerativeAI)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateContent(prompt: string) {
    try {
        // 2. Gọi model
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Hoặc "gemini-2.5-flash"
            contents: prompt,
            config: {
                // Tắt hoặc giảm thinking mode để tối ưu chi phí và tránh lỗi treo SDK
                thinkingConfig: {
                    thinkingLevel: "low" as any 
                }
            }
        });

        // 3. Trả kết quả (Text có thể trả về null, nên cần dự phòng fallback "")
        const resultText = response.text || "";
        return resultText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
```

## 🔎 Các bước Debug nếu API không hoạt động

1. **Verify API Key:** Dùng REST cURL/PowerShell gọi thẳng Endpoint để chẩn đoán xem API Key có bị rate limit `"429 Quota Exceeded"` hay không (Bypass SDK).
2. **Kiểm tra Version SDK:** Mở `package.json` và đảm bảo xoá hẳn `@google/generative-ai` ra khỏi dependencies.
3. **Rollback về Lite:** Nếu `gemini-3-flash-preview` bị kẹt, dùng tạm `gemini-2.5-flash-lite` cho đến khi kết nối ổn định.
4. **Trường `text` undefined:** Khi parse `response.text`, luôn để ý type của nó vì cấu trúc rẽ nhánh mới của genai SDK có thể trả về object thay vì string, nên dùng fallback `|| ""`.
