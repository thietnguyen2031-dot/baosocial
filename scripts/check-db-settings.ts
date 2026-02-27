import { db } from "../packages/db/src";
import { systemSettings } from "../packages/db/src/schema";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env") });

async function checkDB() {
    console.log("🔍 Checking database for Gemini API Keys...\n");

    try {
        const allSettings = await db.select().from(systemSettings);
        console.log("All settings in DB:");
        console.table(allSettings);

        console.log("\n🔑 Gemini API Keys setting:");
        const keySetting = allSettings.find(s => s.key === "gemini_api_keys");
        if (keySetting) {
            console.log("✅ Found:");
            console.log("  Value:", keySetting.value);
            console.log("  Length:", keySetting.value?.length);

            const keys = keySetting.value?.split(/[\n,]+/).map(k => k.trim()).filter(k => k) || [];
            console.log("  Parsed keys count:", keys.length);
            keys.forEach((k, i) => console.log(`  Key ${i + 1}: ...${k.slice(-8)}`));
        } else {
            console.log("❌ NOT FOUND in database!");
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }

    process.exit(0);
}

checkDB();
