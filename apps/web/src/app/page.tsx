import Link from "next/link";
import { auth } from "@/auth";
import FeaturedGrid from "@/components/FeaturedGrid";
import SectionBusiness from "@/components/SectionBusiness";
import SectionCulture from "@/components/SectionCulture";
import SectionVideo from "@/components/SectionVideo";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getNews, getSettings, getCategories } from "@/lib/api";

// Categories for Navbar
const CATEGORIES = ["VĂN HÓA", "THỂ THAO", "KINH TẾ", "VIDEO"];

// ISR enabled via fetch config
// export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();

  // Parallel Fetching
  const [allNews, settings, categories] = await Promise.all([
    getNews(),
    getSettings(),
    getCategories()
  ]);

  // Helper to format timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // Check if valid date
      if (isNaN(date.getTime())) return isoString;

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours < 24) return `${hours} giờ trước`;

      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch { return isoString; }
  };

  // Mapper to convert API item to UI item
  const mapNews = (item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    timestamp: formatTime(item.publishedAt),
    imageUrl: item.thumbnail || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop",
    category: item.category || 'Chưa phân loại',
    author: item.source || 'Ban Biên Tập'
  });

  // Top 5 latest articles for featured section
  const featured = allNews.slice(0, 5).map(mapNews);

  // Helper to filter by exact or partial category name
  const getNewsForCategory = (catName: string, limit: number) => {
    const filtered = allNews.filter((item: any) => {
      const cat = (item.category || "").toLowerCase();
      return cat.includes(catName.toLowerCase()) || catName.toLowerCase().includes(cat);
    });

    return filtered.slice(0, limit).map(mapNews);
  };

  const colors = ["#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#3B82F6"];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <Header session={session} settings={settings} categories={categories.filter((c: any) => c.showOnHeader)} />

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto px-4 lg:px-6 mt-6 lg:mt-8 space-y-12">
        {/* Featured News Grid (Bento) */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Tin Mới</h2>
            </div>
            <FeaturedGrid news={featured} />
          </section>
        )}

        {/* Dynamic Category Sections */}
        {categories.map((cat: any, index: number) => {
          const isVideo = cat.slug.includes('video') || cat.name.toLowerCase().includes('video');
          const limit = isVideo ? 4 : (index % 2 === 0 ? 5 : 4);
          const catNews = getNewsForCategory(cat.name, limit);

          if (catNews.length === 0) return null;

          const color = colors[index % colors.length];

          if (isVideo) {
            return <SectionVideo key={cat.id} title={cat.name} slug={cat.slug} color={color} news={catNews} />;
          }
          if (index % 2 === 0) {
            return <SectionBusiness key={cat.id} title={cat.name} slug={cat.slug} color={color} news={catNews} />;
          } else {
            return <SectionCulture key={cat.id} title={cat.name} slug={cat.slug} color={color} news={catNews} />;
          }
        })}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
