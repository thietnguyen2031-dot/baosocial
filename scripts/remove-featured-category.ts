import 'dotenv/config';
import { db, categories } from "@packages/db";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Removing 'Tin Nổi Bật' category...");
    try {
        await db.delete(categories).where(eq(categories.name, "Tin Nổi Bật"));
        console.log("Deleted 'Tin Nổi Bật' successfully.");
    } catch (e) {
        console.error("Failed to delete category", e);
    }
    process.exit(0);
}

run();
