export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        // Remove Vietnamese diacritics
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        // Replace đ with d
        .replace(/đ/g, "d")
        // Remove special characters except spaces and hyphens
        .replace(/[^a-z0-9\s-]/g, "")
        // Trim and replace spaces with hyphens
        .trim()
        .replace(/\s+/g, "-")
        // Remove consecutive hyphens
        .replace(/-+/g, "-")
        // Limit to 100 characters
        .substring(0, 100)
        // Remove trailing hyphen if any
        .replace(/-$/, "");
}

export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
    let slug = baseSlug;
    let counter = 1;

    while (existingSlugs.includes(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}
