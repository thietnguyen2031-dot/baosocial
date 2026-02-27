import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Mail, Shield, LogOut, Calendar, ChevronRight } from "lucide-react";
import { signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import SignOutButton from "@/components/SignOutButton"; // Need to create Client Component for handle signOut or use inline form? Server Actions preferred or Client Comp.

export const dynamic = 'force-dynamic';

async function getRecentFavorites(userId: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/favorites?userId=${userId}`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.slice(0, 3); // Top 3
    } catch (e) {
        return [];
    }
}

export default async function ProfilePage() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect("/login?callbackUrl=/profile");
    }

    const recentSaved = await getRecentFavorites(session.user.id);
    const user = session.user as any;

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold font-display text-2xl text-slate-900 group">
                        BaoSocial<span className="text-[var(--color-primary)] group-hover:text-blue-600 transition-colors">.vn</span>
                    </Link>
                    <UserMenu session={session} />
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 py-8 lg:py-12">

                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>

                    <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-10">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md bg-slate-200 overflow-hidden shrink-0">
                            {user.image || user.avatar ? (
                                <Image
                                    src={user.image || user.avatar || ""}
                                    width={128}
                                    height={128}
                                    alt={user.name || "User"}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-4xl">
                                    {(user.name || "U").charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{user.name}</h1>
                            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 mt-2 text-slate-500 text-sm font-medium">
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <Mail size={14} className="text-slate-400" /> {user.email}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-wide">
                                    <Shield size={14} className={user.role === 'admin' ? "text-purple-500" : "text-slate-400"} />
                                    {user.role || "Thành viên"}
                                </span>
                            </div>
                        </div>

                        {/* Sign Out Button - Needs Client Logic */}
                        <div className="mb-2">
                            <SignOutButton />
                        </div>
                    </div>
                </div>

                {/* Recent Saved */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-yellow-500">⭐</span> Tin đã lưu gần đây
                        </h2>
                        <Link href="/saved" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                            Xem tất cả <ChevronRight size={14} />
                        </Link>
                    </div>

                    {recentSaved.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
                            <p className="text-slate-400 mb-2 font-medium">Bạn chưa lưu bài viết nào</p>
                            <Link href="/" className="text-sm text-blue-600 font-bold hover:underline">Đọc báo ngay</Link>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {recentSaved.map((item: any) => (
                                <Link
                                    key={item.id}
                                    href={`/tin/${item.article?.slug || item.articleId}`}
                                    className="group bg-white p-3 rounded-xl border border-slate-100 flex gap-4 hover:shadow-md transition-all hover:border-blue-100"
                                >
                                    <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                        {item.article.thumbnail && (
                                            <Image src={item.article.thumbnail} fill alt="" className="object-cover group-hover:scale-105 transition-transform" />
                                        )}
                                    </div>
                                    <div className="flex-1 py-1">
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-700 leading-snug line-clamp-2 mb-1">
                                            {item.article.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar size={12} />
                                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
