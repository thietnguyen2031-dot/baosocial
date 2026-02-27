'use server';

import { db, users } from "@packages/db";
import { eq } from "drizzle-orm";
// @ts-ignore
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password || !name) {
        return { error: "Vui lòng điền đầy đủ thông tin!" };
    }

    try {
        // Check if exists
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (existing) {
            return { error: "Email này đã được sử dụng!" };
        }

        // Create User
        const passwordHash = await bcrypt.hash(password, 10);
        await db.insert(users).values({
            email,
            passwordHash,
            name,
            role: "user"
        });

        return { success: true };
    } catch (error) {
        console.error("Register Error:", error);
        return { error: "Lỗi hệ thống, vui lòng thử lại sau." };
    }
}
