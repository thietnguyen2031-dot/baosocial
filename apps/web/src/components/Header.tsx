'use client';

import Link from "next/link";
import { Search, Bell, Menu, ChevronDown, User } from "lucide-react";
import UserMenu from "./UserMenu";

const slugify = (str: string) => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-z0-9 -]/g, "") // Remove invalid chars
        .replace(/\s+/g, "-") // Collapse whitespace and replace by -
        .replace(/-+/g, "-"); // Collapse dashes
};

export default function Header({ session, settings, categories, ...props }: { session: any, settings?: any, categories?: any[] }) {
    const logoText = settings?.header_logo || "BaoSocial";

    // Use passed categories or fallback
    const navCategories = categories && categories.length > 0
        ? categories
        : ["Văn Hóa", "Thể Thao", "Kinh Tế", "Video"].map(n => ({ name: n, slug: slugify(n) }));

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 transition-all duration-300">
            <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
                <div className="flex justify-between items-center h-16 lg:h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-slate-100 rounded-lg lg:hidden transition-colors">
                            <Menu className="w-6 h-6 text-slate-700" />
                        </button>
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-[var(--color-primary)] to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl lg:text-2xl font-display shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                                {logoText[0]}
                            </div>
                            <span className="text-xl lg:text-2xl font-bold font-display text-slate-900 tracking-tight">{logoText}</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navCategories.map((cat: any) => (
                            <Link
                                href={`/chu-de/${cat.slug}`}
                                key={cat.slug || cat.name}
                                className="relative px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:text-[var(--color-primary)] hover:bg-blue-50/50 transition-all group overflow-hidden uppercase tracking-wide"
                            >
                                <span className="relative z-10">{cat.name}</span>
                                {/* Hover Effect: Animated underline/pip */}
                                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[var(--color-primary)] transition-all duration-300 group-hover:w-1/2 group-hover:-translate-x-1/2"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center bg-slate-100/80 rounded-full px-4 py-2 mr-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 ring-blue-100 focus-within:bg-white transition-all">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Tìm kiếm..."
                                className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 ml-2 w-24 lg:w-32 focus:w-48 transition-all"
                            />
                        </div>
                        <button className="p-2.5 hover:bg-slate-100 rounded-full relative transition-colors">
                            <Bell className="w-5 h-5 text-slate-600" />
                        </button>
                        <UserMenu session={session} />
                    </div>
                </div>
            </div>
        </nav>
    );
}
