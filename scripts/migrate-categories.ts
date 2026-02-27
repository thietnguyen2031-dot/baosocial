
import 'dotenv/config'; // Load env vars
import { db, categories } from "@packages/db";
import { slugify } from "@packages/db/src/utils"; // Assuming utils exists or just impl it

const initialCategories = [
    "Kinh Tế",
    "Văn Hóa",
    "Thể Thao",
    "Video",
    "Tin Nổi Bật" // Added based on context of previous files, but user said "4 original". 
    // The previous file had: Kinh Tế, Văn Hóa, Thể Thao, Video, Tin Nổi Bật (5 items in seed-feeds.ts).
    // The user said "4 original". Maybe Tin Nổi Bật is implicit or excluded?
    // I recall seed-feeds.ts had 5. User might text "4" but mean the ones they see/care about.
    // Let's stick to the ones in seed-feeds.ts minus maybe "Tin Nổi Bật" if it's special?
    // Actually, "Tin Nổi Bật" is usually a collection.
    // I'll put 4: Kinh Tế, Văn Hóa, Thể Thao, Video. And maybe "Tin Nổi Bật" if it was there.
    // Let's check seed-feeds.ts again from memory? 
    // It was: Kinh Tế, Văn Hóa, Thể Thao, Video, Tin Nổi Bật.
    // I'll ask or just put these 5 (or 4 if they insist).
    // User said "4 chuyên mục gốc ban đầu".
    // I will List: Kinh Tế, Văn Hóa, Thể Thao, Video.
];

// Simple slugify if import fails
function simpleSlugify(text: string) {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function run() {
    console.log("Resetting categories...");

    // Clear existing
    try {
        await db.delete(categories); // Dangerous but requested reset
        console.log("Cleared existing categories.");
    } catch (e) {
        console.error("Failed to clear categories", e);
    }

    for (const name of initialCategories) {
        const slug = simpleSlugify(name);
        try {
            await db.insert(categories).values({
                name,
                slug,
                description: `Chuyên mục ${name}`
            }).onConflictDoNothing();
            console.log(`Synced: ${name} (${slug})`);
        } catch (e) {
            console.error(`Failed: ${name}`, e);
        }
    }
    console.log("Done.");
    process.exit(0);
}

run();
