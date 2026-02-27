'use client';

import { useState } from 'react';
import { signOut, signIn } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, Settings, Bookmark } from 'lucide-react';

export default function UserMenu({ session }: { session: any }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!session) {
        return (
            <button
                onClick={() => signIn('google')}
                className="hidden sm:block btn-primary text-sm px-5 py-2.5 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
            >
                Đăng nhập
            </button>
        );
    }

    const startLetter = session.user?.name?.charAt(0) || "U";

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-full pl-2 pr-4 py-1.5 transition-colors border border-transparent hover:border-slate-200"
            >
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {startLetter}
                </div>
                <span className="text-sm font-bold text-slate-700 hidden sm:block max-w-[100px] truncate">
                    {session.user?.name}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tài khoản</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{session.user?.email}</p>
                    </div>

                    <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)] transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User size={16} /> Trang cá nhân
                    </Link>

                    <Link
                        href="/saved"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)] transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Bookmark size={16} /> Tin đã lưu
                    </Link>

                    {session.user?.role === 'admin' && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 font-medium transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Settings size={16} /> Quản trị Admin
                        </Link>
                    )}

                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                        <LogOut size={16} /> Đăng xuất
                    </button>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
        </div>
    );
}
