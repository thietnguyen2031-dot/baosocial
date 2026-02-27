import dotenv from "dotenv";
import path from "path";

// Load .env from monorepo root (../../../.env)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
