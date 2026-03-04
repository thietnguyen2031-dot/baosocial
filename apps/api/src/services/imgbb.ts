import FormData from "form-data";

/**
 * Uploads an image URL to a single ImgBB account
 */
async function uploadToSingleAccount(imageUrl: string, apiKey: string): Promise<string | null> {
    try {
        const fetchRes = await fetch(imageUrl);
        if (!fetchRes.ok) return null;

        const buffer = Buffer.from(await fetchRes.arrayBuffer());

        const formData = new FormData();
        formData.append('image', buffer.toString('base64'));

        // ImgBB API supports direct base64 upload over standard POST
        const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData as any
        });

        const data = await uploadRes.json();

        if (data && data.success && data.data && data.data.url) {
            return data.data.url;
        }
        return null;
    } catch (err) {
        console.error(`[ImgBB API] Single upload failed:`, err);
        return null; // Return null so Promise.allSettled deals with it cleanly
    }
}

export interface DualUploadResult {
    primaryUrl: string;
    backupUrl: string;
    originalUrl: string;
}

/**
 * Uploads an image to 2 ImgBB accounts simultaneously.
 */
export async function uploadToImgBBDual(imageUrl: string, throwError = false): Promise<DualUploadResult | null> {
    const keysStr = process.env.IMGBB_API_KEYS;
    if (!keysStr) {
        if (throwError) throw new Error("Missing IMGBB_API_KEYS in environment");
        return null;
    }

    const keys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keys.length === 0) {
        if (throwError) throw new Error("IMGBB_API_KEYS is empty after parsing.");
        return null;
    }

    console.log(`[ImgBB API] ☁️ Uploading ${imageUrl} in parallel...`);

    const result: DualUploadResult = {
        primaryUrl: imageUrl,
        backupUrl: imageUrl,
        originalUrl: imageUrl
    };

    try {
        // Upload to all available keys simultaneously
        const promises = keys.map(key => uploadToSingleAccount(imageUrl, key));
        const results = await Promise.allSettled(promises);

        // Map outcomes
        const successfulUrls = results
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value !== null)
            .map(r => r.value);

        if (successfulUrls.length > 0) {
            // Priority 1: Primary Account
            result.primaryUrl = successfulUrls[0];

            // Priority 2: Backup Account (If only 1 key works/provided, backup = primary)
            result.backupUrl = successfulUrls.length > 1 ? successfulUrls[1] : successfulUrls[0];

            console.log(`[ImgBB API] ✅ Success: ${result.primaryUrl} (Backup: ${result.backupUrl})`);
            return result;
        }

        // All keys failed or returned null
        if (throwError) throw new Error("All ImgBB accounts failed to upload this image.");
        return null; // Signals the index.ts crawler to fallback
    } catch (err: any) {
        console.error("[ImgBB API] General upload failure:", err);
        if (throwError) throw new Error("Upload Process Error: " + err.message);
        return null;
    }
}
