import Link from "next/link";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Globe } from "lucide-react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // If no session, redirect to login page
    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <span className="text-xl font-bold font-display text-white">BaoSocial<span className="text-[var(--color-primary)]">.Admin</span></span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <NavItem href="/admin" icon={<LayoutDashboard size={20} />} label="Tổng quan" />
                    <NavItem href="/admin/news" icon={<FileText size={20} />} label="Quản lý tin tức" />
                    <NavItem href="/admin/categories" icon={<LayoutDashboard size={20} />} label="Chuyên mục" />

                    {/* Admin Only Links */}
                    {/* @ts-ignore */}
                    {session?.user?.role === "admin" && (
                        <>
                            <NavItem href="/admin/crawler" icon={<Globe size={20} />} label="Cấu hình Crawler" />
                            <NavItem href="/admin/users" icon={<Users size={20} />} label="Thành viên" />
                            <NavItem href="/admin/settings" icon={<Settings size={20} />} label="Cài đặt hệ thống" />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                            {session?.user?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                        </div>
                    </div>

                    <form action={async () => {
                        'use server';
                        await signOut();
                    }}>
                        <button className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 w-full px-2 py-2 rounded hover:bg-slate-800 transition-colors">
                            <LogOut size={18} />
                            Đăng xuất
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all font-medium"
        >
            {icon}
            {label}
        </Link>
    );
}
