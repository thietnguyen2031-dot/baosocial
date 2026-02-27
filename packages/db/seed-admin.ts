import { db, users } from "./src";
import { eq } from "drizzle-orm";
// @ts-ignore
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

async function main() {
    const email = "duymanh@benthanhmedia.net";
    const password = "Bt2030@dm";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (existing) {
        console.log("Admin already exists. Updating password...");
        await db.update(users).set({
            passwordHash: hashedPassword,
            role: "admin",
            name: "Duy Manh"
        }).where(eq(users.email, email));
    } else {
        console.log("Creating Admin...");
        await db.insert(users).values({
            email,
            passwordHash: hashedPassword,
            name: "Duy Manh",
            role: "admin"
        });
    }
    console.log("Done!");
    process.exit(0);
}

main();
