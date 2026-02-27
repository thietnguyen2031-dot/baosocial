'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SaveButton({ articleId, session }: { articleId: number, session: any }) {
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (session) checkStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [articleId, session]);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/favorites/check?userId=${session.user.id}&articleId=${articleId}`);
            if (res.ok) {
                const data = await res.json();
                setSaved(data.isFavorited);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleSave = async () => {
        if (!session) {
            alert("Vui lòng đăng nhập để lưu bài viết!");
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const method = saved ? 'DELETE' : 'POST';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/favorites`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    articleId
                })
            });

            if (res.ok) {
                setSaved(!saved);
            } else {
                alert("Lỗi khi lưu bài viết");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleSave}
            disabled={loading}
            className={`p-2.5 rounded-full transition-all border ${saved
                ? 'bg-yellow-50 border-yellow-200 text-yellow-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                }`}
            title={saved ? "Bỏ lưu" : "Lưu bài viết"}
        >
            <Bookmark className={`w-6 h-6 ${saved ? 'fill-current' : ''}`} />
        </button>
    );
}
