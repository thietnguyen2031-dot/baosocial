'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError('Tài khoản hoặc mật khẩu không đúng');
            } else {
                router.push('/admin');
                router.refresh();
            }
        } catch (err) {
            setError('Đã có lỗi xảy ra');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-display text-slate-900 mb-2">BaoSocial Admin</h1>
                    <p className="text-slate-500">Đăng nhập hệ thống quản trị</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                    >
                        Đăng nhập
                    </button>
                </form>
            </div>
        </div>
    );
}
