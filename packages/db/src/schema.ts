import { pgTable, serial, text, timestamp, integer, boolean, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"), // Optional for OAuth
    name: text("name"),
    role: text("role").default("user"), // 'admin' | 'user'
    avatar: text("avatar"),
    image: text("image"), // Required by NextAuth
    status: text("status").default("active"), // 'active' | 'banned'
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    summary: text("summary"),
    contentAi: text("content_ai"),
    thumbnail: text("thumbnail"), // Added for image persistence
    sourceUrl: text("source_url"),
    // SEO Fields (Option C)
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    focusKeyword: text("focus_keyword"),
    status: text("status").default("PENDING"), // PENDING | PUBLISHED
    category: text("category"), // Denormalized for easier query
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const rssFeeds = pgTable("rss_feeds", {
    id: serial("id").primaryKey(),
    url: text("url").notNull().unique(),
    source: text("source").notNull(), // VnExpress, BaoQuocTe...
    category: text("category").notNull(), // Target category
    contentSelector: text("content_selector"), // Custom CSS selector to capture content
    excludeSelector: text("exclude_selector"), // Custom CSS selector to remove elements
    titleSelector: text("title_selector"), // Custom CSS selector for Title
    descriptionSelector: text("description_selector"), // Custom CSS selector for Description
    autoSeo: boolean("auto_seo").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    articleId: integer("article_id").references(() => articles.id),
    parentId: integer("parent_id"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    articleId: integer("article_id").references(() => articles.id),
    createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
}, (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const sessions = pgTable("sessions", {
    sessionToken: text("session_token").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
}, (verificationToken) => ({
    compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
    }),
}));

export const authenticators = pgTable("authenticator", {
    credentialID: text("credential_id").notNull().unique(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
}, (authenticator) => ({
    compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
    }),
}));

export const systemSettings = pgTable("system_settings", {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(), // e.g., 'header_logo', 'footer_text'
    value: text("value"),
    description: text("description"),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    telegramChatId: text("telegram_chat_id"),
    showOnHeader: boolean("show_on_header").default(false),
    listOrder: integer("list_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});
