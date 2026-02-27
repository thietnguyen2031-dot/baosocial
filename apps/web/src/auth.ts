import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, accounts, sessions, verificationTokens } from "@packages/db";
import { eq } from "drizzle-orm";
// @ts-ignore
import bcrypt from "bcryptjs";

console.log("🔹 [AUTH] Loading NextAuth...");
console.log("🔹 [AUTH] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "FOUND" : "MISSING");
console.log("🔹 [AUTH] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "FOUND" : "MISSING");
console.log("🔹 [AUTH] AUTH_SECRET:", process.env.AUTH_SECRET ? "FOUND" : "MISSING");

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users as any,
        accountsTable: accounts as any,
        sessionsTable: sessions as any,
        verificationTokensTable: verificationTokens as any,
    }),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true, // Allow linking Gmail if email exists
        }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials.email || !credentials.password) return null;

                const user = await db.query.users.findFirst({
                    where: eq(users.email, credentials.email as string)
                });

                if (!user || !user.passwordHash) return null; // No password = OAuth user

                // Validation
                const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // @ts-ignore
                token.role = user.role || "user";
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                // @ts-ignore
                session.user.id = token.sub;
                // @ts-ignore
                session.user.role = token.role;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt" // Ensure JWT strategy for flexibility
    },
    secret: process.env.AUTH_SECRET || "supersecret123",
});
