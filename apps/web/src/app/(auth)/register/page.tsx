'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerUser } from '@/actions/auth';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const res = await registerUser(formData);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            router.push('/login');
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <Link href="/" className="text-3xl font-black font-display text-slate-900 block mb-2">
                    BaoSocial<span className="text-[var(--color-primary)]">.vn</span>
                </Link>
                <h2 className="text-xl font-bold text-slate-700">Đăng ký tài khoản mới</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên</label>
                    <input
                        name="name"
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="Nguyễn Văn A"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="email@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-black/20 disabled:opacity-50"
                >
                    {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Hoặc đăng ký với</span>
                    </div>
                </div>

                <div className="mb-0">
                    {/* Re-using same button style/logic would be better in a component, but copying for speed as requested */}
                    <button
                        type="button"
                        onClick={() => {
                            // Use next-auth/react/signIn client-side
                            const { signIn } = require("next-auth/react");
                            signIn('google', { callbackUrl: '/' });
                        }}
                        className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                </div>

                <div className="text-center text-sm text-slate-500">
                    Đã có tài khoản?{' '}
                    <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
                        Đăng nhập
                    </Link>
                </div>
            </form>
        </div>
    );
}
