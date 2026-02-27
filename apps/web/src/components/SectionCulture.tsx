import Link from "next/link";
import Image from "next/image";

interface NewsItem {
    id: number;
    title: string;
    slug: string;
    summary?: string;
    timestamp: string;
    imageUrl?: string;
}

interface SectionProps {
    title: string;
    slug?: string;
    color?: string;
    news: NewsItem[];
}

export default function SectionCulture({ title, slug, color = "#8B5CF6", news }: SectionProps) {
    if (!news || news.length === 0) return null;
    return (
        <section className="py-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-slate-900 border-l-4 pl-3" style={{ borderColor: color }}>
                    <Link href={`/chu-de/${slug || title}`} className="hover:text-[var(--color-primary)] transition-colors">
                        {title}
                    </Link>
                </h2>
                <Link href={`/chu-de/${slug || title}`} className="text-sm font-bold text-slate-500 hover:text-[var(--color-primary)] transition-colors uppercase">
                    Xem tất cả
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {news.map((item) => (
                    <div key={item.id} className="group flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100">
                        <Link href={`/tin/${item.slug}`} className="flex flex-col h-full p-3 lg:p-4">
                            <div className="relative aspect-[4/3] overflow-hidden rounded mb-3">
                                {item.imageUrl && (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                )}
                            </div>

                            <h3 className="text-[17px] font-bold font-display leading-[1.35] text-slate-900 group-hover:text-[var(--color-primary)] transition-colors mb-2 line-clamp-3">
                                {item.title}
                            </h3>
                            <div className="mt-auto pt-2">
                                <span className="text-xs font-medium text-slate-400 uppercase">{item.timestamp}</span>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}
