import { db } from "@packages/db";

/**
 * Uploads an image URL to a single ImgBB account.
 * Uses URLSearchParams (application/x-www-form-urlencoded) which is
 * compatible with native Node.js fetch and the ImgBB API.
 */
async function uploadToSingleAccount(imageUrl: string, apiKey: string): Promise<string | null> {
    try {
        // Extract origin from image URL for Referer header (bypass hotlink protection)
        let referer = imageUrl;
        try { referer = new URL(imageUrl).origin; } catch { }

        const fetchRes = await fetch(imageUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': referer,
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            }
        });
        if (!fetchRes.ok) {
            console.warn(`[ImgBB] Could not fetch image (${fetchRes.status}): ${imageUrl}`);
            return null;
        }

        const buffer = Buffer.from(await fetchRes.arrayBuffer());
        const base64 = buffer.toString('base64');

        // URLSearchParams works natively with fetch (no Content-Type boundary issues)
        const body = new URLSearchParams();
        body.append('image', base64);

        const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body,
        });

        const data = await uploadRes.json() as any;

        if (data?.success && data?.data?.url) {
            console.log(`[ImgBB] ✅ Uploaded: ${data.data.url}`);
            return data.data.url;
        }

        console.warn(`[ImgBB] Upload rejected by API:`, JSON.stringify(data));
        return null;
    } catch (err) {
        console.error(`[ImgBB API] Single upload failed:`, err);
        return null;
    }
}

/**
 * Gets ImgBB API keys from DB settings first, env var as fallback.
 */
async function getImgBBKeys(throwError = false): Promise<string[]> {
    // 1. Try DB first (keys saved via Admin UI)
    try {
        const setting = await db.query.systemSettings.findFirst({
            where: (s, { eq }) => eq(s.key, "imgbb_api_keys")
        });
        if (setting?.value) {
            const dbKeys = setting.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
            if (dbKeys.length > 0) return dbKeys;
        }
    } catch (e) {
        console.warn("[ImgBB API] Could not read keys from DB, falling back to env var.");
    }

    // 2. Fallback to env var
    const keysStr = process.env.IMGBB_API_KEYS;
    if (!keysStr) {
        if (throwError) throw new Error("Missing IMGBB_API_KEYS: set it in Admin Settings or environment variables.");
        return [];
    }
    return keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
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
    const keys = await getImgBBKeys(throwError);

    if (keys.length === 0) {
        if (throwError) throw new Error("No ImgBB API keys found in DB or environment.");
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
