"use client";

import Link from "next/link";
import Image from "next/image";

interface NewsItem {
    id: number | string;
    slug: string;
    title: string;
    summary: string;
    category: string;
    timestamp: string;
    imageUrl: string;
    author: string;
}

interface FeaturedGridProps {
    news?: NewsItem[]; // Optional to prevent crash if empty
}

export default function FeaturedGrid({ news = [] }: FeaturedGridProps) {
    // Fallback if no news provided
    if (!news || news.length === 0) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400">
                Đang tải tin nổi bật...
            </div>
        );
    }

    const [mainNews, ...sideNews] = news;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
            {/* Main Feature (Left - 8 cols) */}
            <div className="lg:col-span-7 relative h-[400px] lg:h-[500px] group overflow-hidden">
                <Link href={`/tin/${mainNews.slug}`}>
                    <Image
                        src={mainNews.imageUrl}
                        alt={mainNews.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                            <span className="inline-block bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 mb-3 uppercase">
                                {mainNews.category}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-bold font-display text-white leading-tight mb-2 hover:text-blue-200 transition-colors">
                                {mainNews.title}
                            </h2>
                            <div className="text-slate-300 text-sm font-medium flex items-center gap-2">
                                <span>{mainNews.author}</span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                <span>{mainNews.timestamp}</span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Side News (Right - 4 cols, stacked) */}
            <div className="lg:col-span-5 grid grid-rows-3 gap-1 h-[500px]">
                {sideNews.map((news) => (
                    <div key={news.id} className="relative group overflow-hidden h-full">
                        <Link href={`/tin/${news.slug}`} className="block h-full">
                            <Image
                                src={news.imageUrl}
                                alt={news.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                                <div className="absolute bottom-0 left-0 p-4 w-full">
                                    <span className="inline-block bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 mb-2 uppercase border border-white/20">
                                        {news.category}
                                    </span>
                                    <h3 className="text-lg font-bold font-display text-white leading-snug hover:text-blue-200 transition-colors line-clamp-2">
                                        {news.title}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
