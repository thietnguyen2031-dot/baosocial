import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Calendar, Trash2 } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export const dynamic = 'force-dynamic';

async function getFavorites(userId: string) {
    try {
        const res = await fetch(`http://localhost:3001/favorites?userId=${userId}`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch (e) {
        return [];
    }
}

export default async function SavedPage() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect("/login?callbackUrl=/saved");
    }

    const favorites = await getFavorites(session.user.id);

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1280px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold font-display text-2xl text-slate-900">
                        BaoSocial<span className="text-[var(--color-primary)]">.vn</span>
                    </Link>
                    <UserMenu session={session} />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span> Tin đã lưu
                </h1>

                {favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-slate-400 mb-4">Bạn chưa lưu tin nào.</p>
                        <Link href="/" className="btn-primary inline-block px-6 py-2">Khám phá tin tức</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {favorites.map((item: any) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-4 md:gap-6 group">
                                <Link href={`/tin/${item.article?.slug || item.articleId}`} className="shrink-0 w-24 h-24 md:w-40 md:h-28 relative rounded-lg overflow-hidden bg-slate-200">
                                    {item.article.thumbnail ? (
                                        <Image src={item.article.thumbnail} fill alt={item.article.title} className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">NO IMG</div>
                                    )}
                                </Link>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <Link href={`/tin/${item.article?.slug || item.articleId}`}>
                                            <h3 className="font-bold text-slate-900 text-lg md:text-xl line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                                                {item.article.title}
                                            </h3>
                                        </Link>
                                        <p className="text-slate-500 text-sm mt-1 line-clamp-1 hidden md:block">{item.article.summary}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                        {/* Remove button could be implemented here as Client Component if needed, currently rely on Article Detail to toggle */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
