import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// robust env loading for monorepo
// process.env.DATABASE_URL should be loaded by the consuming application (Next.js or Express)
if (!process.env.DATABASE_URL) {
    console.warn("⚠️ [DB] DATABASE_URL is missing. Ensure .env is loaded by the app.");
}

const connectionString = process.env.DATABASE_URL || "";
debugger; // Trace
console.log("🔌 [DB] Connection String:", connectionString ? "FOUND" : "MISSING");
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export * from "./schema";
