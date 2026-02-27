'use client';
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
        >
            <LogOut size={16} />
            Đăng xuất
        </button>
    )
}
