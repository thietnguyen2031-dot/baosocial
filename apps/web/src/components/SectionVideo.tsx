import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

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

export default function SectionVideo({ title, slug, color = "#F59E0B", news }: SectionProps) {
    if (!news || news.length === 0) return null;
    const [main, ...others] = news;

    return (
        <section className="py-12 bg-slate-900 -mx-4 lg:-mx-6 px-4 lg:px-6 my-8">
            <div className="max-w-[1280px] mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white">
                        <Play className="w-5 h-5 fill-current" />
                    </div>
                    <h2 className="text-3xl font-bold font-display uppercase tracking-tight text-white">
                        <Link href={`/chu-de/${slug || title}`} className="hover:text-red-500 transition-colors">
                            {title}
                        </Link>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Video */}
                    <div className="lg:col-span-2 group">
                        <Link href={`/tin/${main.slug}`} className="block">
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-4 shadow-2xl shadow-black/50">
                                {main.imageUrl && (
                                    <Image
                                        src={main.imageUrl}
                                        alt={main.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                                            <Play className="w-6 h-6 text-white fill-current ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold font-display text-white leading-tight hover:text-red-500 transition-colors">
                                {main.title}
                            </h3>
                        </Link>
                    </div>

                    {/* Side Videos List */}
                    <div className="space-y-6">
                        {others.map((item) => (
                            <div key={item.id} className="group">
                                <Link href={`/tin/${item.slug}`} className="flex gap-4">
                                    <div className="relative w-36 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
                                        {item.imageUrl && (
                                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[16px] font-bold text-slate-200 leading-snug group-hover:text-red-500 transition-colors line-clamp-2 mb-2">
                                            {item.title}
                                        </h4>
                                        <span className="text-xs text-slate-500">{item.timestamp}</span>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
