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

export default function SectionBusiness({ title, slug, color = "#10B981", news }: SectionProps) {
    if (!news || news.length === 0) return null;
    const [main, ...others] = news;

    return (
        <section className="py-8 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-slate-900">
                    <Link href={`/chu-de/${slug || title}`} className="hover:text-[var(--color-primary)] transition-colors">
                        {title}
                    </Link>
                </h2>
                <div className="flex-1 h-[1px] bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Article - Left (Cols 7) */}
                <div className="lg:col-span-7 group">
                    <Link href={`/tin/${main.slug}`} className="block">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-4">
                            {main.imageUrl && (
                                <Image
                                    src={main.imageUrl}
                                    alt={main.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            )}
                        </div>

                        <h3 className="text-2xl font-bold font-display leading-tight text-slate-900 group-hover:text-[var(--color-primary)] transition-colors mb-3">
                            {main.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed mb-3">
                            {main.summary}
                        </p>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{main.timestamp}</span>
                    </Link>
                </div>

                {/* Side List - Right (Cols 5) */}
                <div className="lg:col-span-5 flex flex-col divide-y divide-slate-100">
                    {others.map((item) => (
                        <div key={item.id} className="group py-4 first:pt-0">
                            <Link href={`/tin/${item.slug}`} className="flex gap-4">
                                <div className="flex-1">
                                    <h4 className="text-[17px] font-bold text-slate-900 leading-[1.4] group-hover:text-[var(--color-primary)] transition-colors mb-2">
                                        {item.title}
                                    </h4>
                                    <span className="text-xs text-slate-400">{item.timestamp}</span>
                                </div>
                                {item.imageUrl && (
                                    <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden">
                                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                )}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
