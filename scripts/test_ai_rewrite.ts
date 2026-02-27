import { db } from "../packages/db/src";
import { systemSettings } from "../packages/db/src/schema";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env") });

async function checkSettings() {
    console.log("Checking DB Settings...");
    try {
        const settings = await db.select().from(systemSettings);
        console.log("Settings:", JSON.stringify(settings, null, 2));
    } catch (e: any) {
        console.error("DB Error:", e);
    }
    process.exit(0);
}

checkSettings();
