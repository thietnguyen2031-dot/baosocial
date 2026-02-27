import * as dotenv from "dotenv";
import { db } from "@packages/db";
import { users } from "@packages/db/src/schema";
import bcrypt from "bcryptjs";

// Load env before anything else
dotenv.config({ path: "./.env" });

async function createAdmin() {
    try {
        console.log("Checking for admin user...");
        const passwordHash = await bcrypt.hash("Bt2030@dm", 10);

        await db.insert(users).values({
            name: "Duy Manh",
            email: "duymanh@benthanhmedia.net",
            passwordHash: passwordHash,
            role: "admin",
            status: "active"
        });

        console.log("✅ Admin user created successfully!");
        console.log("Email: duymanh@benthanhmedia.net");
        console.log("Password: Bt2030@dm");
    } catch (e: any) {
        if (e.message.includes("duplicate key value")) {
            console.log("Admin user already exists.");
        } else {
            console.error("Error creating admin:", e.message);
        }
    }
    process.exit();
}

createAdmin();
