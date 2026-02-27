import Link from "next/link";
import Image from "next/image";

interface NewsItem {
    id: number;
    title: string;
    summary?: string;
    timestamp: string;
    imageUrl?: string;
}

interface CategoryBlockProps {
    title: string;
    slug?: string;
    color?: string;
    news: NewsItem[];
}

export default function CategoryBlock({ title, slug, color = "var(--color-primary)", news }: CategoryBlockProps) {
    const [main, ...others] = news;

    return (
        <div className="flex flex-col h-full group/block">
            {/* Header with Top Border Style */}
            <div className="mb-4 border-t-[3px]" style={{ borderColor: color }}>
                <h3 className="inline-block mt-[-3px] pt-1">
                    <Link href={`/chu-de/${slug || title}`} className="text-lg font-extrabold uppercase tracking-tight hover:text-[var(--color-primary)] transition-colors text-slate-900" style={{ color: color }}>
                        {title}
                    </Link>
                </h3>
            </div>

            {/* Content */}
            <div className="flex flex-col">
                {/* Main Article */}
                <div className="group cursor-pointer mb-5">
                    {main.imageUrl && (
                        <div className="relative aspect-[3/2] overflow-hidden mb-3.5 rounded-sm">
                            <Image
                                src={main.imageUrl}
                                alt={main.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                        </div>
                    )}
                    <h4 className="text-[19px] font-bold font-display leading-snug mb-2 group-hover:text-[var(--color-primary)] transition-colors text-slate-900">
                        {main.title}
                    </h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed line-clamp-2 mb-2">{main.summary}</p>
                    <span className="text-xs text-slate-400 font-medium">{main.timestamp}</span>
                </div>

                {/* Sub List with Solid Dividers */}
                <div className="flex flex-col border-t border-slate-200">
                    {others.map((item) => (
                        <div key={item.id} className="group flex gap-4 items-start py-4 border-b border-slate-200">
                            <div className="flex-1 flex flex-col justify-between h-full">
                                <h5 className="text-[15px] font-bold text-slate-800 leading-[1.4] group-hover:text-[var(--color-primary)] transition-colors line-clamp-3 cursor-pointer">
                                    {item.title}
                                </h5>
                                <span className="text-[11px] text-slate-400 mt-1.5">{item.timestamp}</span>
                            </div>

                            {/* Small Thumb */}
                            {item.imageUrl && (
                                <div className="relative w-[88px] h-[60px] flex-shrink-0 bg-slate-100 rounded-sm overflow-hidden">
                                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
