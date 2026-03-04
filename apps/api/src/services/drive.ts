import { google } from 'googleapis';
import { Readable } from 'stream';

// Singleton for Drive API
let driveService: any = null;

function getDriveService(throwError = false) {
    if (driveService) return driveService;

    const credentialsStr = process.env.GOOGLE_DRIVE_CREDENTIALS;
    if (!credentialsStr) {
        if (throwError) throw new Error("Missing GOOGLE_DRIVE_CREDENTIALS");
        return null;
    }

    try {
        const credentials = JSON.parse(credentialsStr);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        driveService = google.drive({ version: 'v3', auth });
        return driveService;
    } catch (error: any) {
        console.error("[Drive API] Failed to parse credentials:", error);
        if (throwError) throw new Error("Credentials Parse Error: " + error.message);
        return null;
    }
}

export async function uploadImageToDrive(imageUrl: string, throwError = false): Promise<string | null> {
    const drive = getDriveService(throwError);
    if (!drive) {
        console.log("[Drive API] No credentials configured. Skipping auto-upload.");
        if (throwError) throw new Error("Drive service not initialized (Check JSON credentials)");
        return imageUrl; // Fallback to original
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
        console.warn("[Drive API] Missing GOOGLE_DRIVE_FOLDER_ID in environment.");
        if (throwError) throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");
        return imageUrl;
    }

    try {
        console.log(`[Drive API] 📥 Downloading image: ${imageUrl}`);
        const response = await fetch(imageUrl);

        if (!response.ok) {
            console.warn(`[Drive API] Failed to fetch image: ${response.statusText}`);
            if (throwError) throw new Error(`HTTP Download Fetch Error: ${response.status} ${response.statusText}`);
            return imageUrl;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';

        // Convert Buffer to Readable Stream format required by googleapis
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileName = `baosocial_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        console.log(`[Drive API] ☁️ Uploading ${fileName} to Drive...`);
        const file = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
            },
            media: {
                mimeType,
                body: stream,
            },
            fields: 'id',
        });

        const fileId = file.data.id;

        if (fileId) {
            console.log(`[Drive API] ✅ Uploaded successfully. ID: ${fileId}`);
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }

        if (throwError) throw new Error("File ID was not returned by Google Drive API.");
        return imageUrl;
    } catch (error: any) {
        console.error("[Drive API] Error uploading image:", error);
        if (throwError) throw new Error("Upload Process Error: " + error.message);
        return imageUrl; // Fallback
    }
}
