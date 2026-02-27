import { auth } from "@/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getNews, getSettings, getCategories } from "@/lib/api";
import Link from "next/link";
import { Clock } from "lucide-react";

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const session = await auth();
    const [allNews, settings, categories] = await Promise.all([
        getNews(),
        getSettings(),
        getCategories()
    ]);

    const slug = decodeURIComponent(params.slug);
    // Find category info
    const categoryInfo = categories.find((c: any) => c.slug === slug || (c.name && c.name.toLowerCase() === slug.toLowerCase()));
    const categoryName = categoryInfo ? categoryInfo.name : slug.replace(/-/g, ' ').toUpperCase();

    // Filter news by category
    // Note: The Crawler saves category as "Name" (e.g. "Kinh Tế"), but slug is "kinh-te".
    // We should match by slug if possible, or name.
    // The current data in DB has category="Kinh Tế".
    // So we need to match categoryInfo.name or just fuzzy match.

    // Better: Match by exact category name if we found categoryInfo, else loose match
    const categoryFilter = categoryInfo ? categoryInfo.name : "";

    const news = allNews.filter((item: any) => {
        if (!item.category) return false;
        // Exact match preferred
        if (categoryFilter && item.category === categoryFilter) return true;
        // Fallback: slug match
        return item.category.toLowerCase().includes(slug.replace(/-/g, ' ').toLowerCase());
    });

    // Helper to format timestamp
    const formatTime = (isoString: string) => {
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return isoString;
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return isoString; }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header session={session} settings={settings} categories={categories.filter((c: any) => c.showOnHeader)} />

            <main className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
                {/* Breadcrumb / Title */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-medium uppercase tracking-wider">
                        <Link href="/" className="hover:text-[var(--color-primary)]">Trang chủ</Link>
                        <span>/</span>
                        <span className="text-slate-900">{categoryName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-[var(--color-primary)] rounded-full"></div>
                        <h1 className="text-3xl lg:text-4xl font-bold font-display text-slate-900">{categoryName}</h1>
                    </div>
                    {categoryInfo?.description && (
                        <p className="mt-2 text-slate-600 max-w-2xl">{categoryInfo.description}</p>
                    )}
                </div>

                {/* News Grid */}
                {news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {news.map((item: any) => (
                            <Link href={`/tin/${item.slug || item.id}`} key={item.id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all">
                                <div className="aspect-video overflow-hidden relative bg-slate-100">
                                    <img
                                        src={item.thumbnail || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop"}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold rounded uppercase">
                                        {item.source || "BaoSocial"}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                        <Clock size={14} />
                                        <span>{formatTime(item.publishedAt)}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                        {item.summary}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có tin tức</h3>
                        <p className="text-slate-500">Chuyên mục này chưa có bài viết nào.</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
