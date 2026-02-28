/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export async function getNews() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/articles`, { cache: 'no-store' });
        if (!res.ok) return [];
        const json = await res.json();
        return json || [];
    } catch (e) {
        console.error("Failed to fetch news", e);
        return [];
    }
}

export async function getRelatedArticles(category: string, excludeId: string) {
    try {
        const allNews = await getNews();
        return allNews
            .filter((n: any) => n.id != excludeId && n.id != Number(excludeId))
            .slice(0, 4);
    } catch (e) {
        return [];
    }
}

export async function getArticle(id: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/articles/${id}`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

export async function getSettings() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/settings`, { next: { revalidate: 60 } });
        if (!res.ok) return {};
        const data = await res.json();
        return data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    } catch (e) {
        return {};
    }
}

export async function getCategories(headerOnly = false) {
    try {
        const url = headerOnly ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories?header=true` : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}
