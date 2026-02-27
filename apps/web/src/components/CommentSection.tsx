'use client';

import { useState, useEffect } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Comment {
    id: number;
    content: string;
    parentId: number | null;
    createdAt: string;
    user: {
        id: number;
        name: string;
        avatar: string | null;
    };
}

export default function CommentSection({ articleId, session }: { articleId: number, session: any }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [articleId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`http://localhost:3001/comments?articleId=${articleId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (e) {
            console.error("Failed to load comments", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) {
            alert("Vui lòng đăng nhập để bình luận!");
            router.push('/login');
            return;
        }
        if (!content.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    articleId,
                    content
                })
            });

            if (res.ok) {
                setContent('');
                fetchComments(); // Reload comments
            } else {
                alert("Lỗi khi gửi bình luận");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                Bình luận <span className="text-slate-400 text-base font-normal">({comments.length})</span>
            </h3>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mb-8">
                {session ? (
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold flex-shrink-0">
                            {session.user?.name?.[0] || "U"}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Viết bình luận của bạn..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !content.trim()}
                                    className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? 'Đang gửi...' : <><Send size={16} /> Gửi</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-6 rounded-lg text-center border border-slate-100">
                        <p className="text-slate-600 mb-4">Vui lòng đăng nhập để tham gia thảo luận</p>
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="px-6 py-2 bg-[var(--color-primary)] text-white font-bold rounded-lg hover:bg-blue-700"
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                )}
            </form>

            {/* Comment List */}
            <div className="space-y-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                            {comment.user.avatar ? (
                                <img src={comment.user.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                            ) : (
                                <span className="font-bold">{comment.user.name?.[0] || <UserIcon size={20} />}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="bg-slate-50 p-4 rounded-xl rounded-tl-none">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-slate-900">{comment.user.name}</h4>
                                    <span className="text-xs text-slate-500">
                                        {new Date(comment.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{comment.content}</p>
                            </div>
                            <div className="flex gap-4 mt-1 pl-2">
                                <button className="text-xs font-bold text-slate-500 hover:text-[var(--color-primary)]">Trả lời</button>
                                <button className="text-xs font-bold text-slate-500 hover:text-[var(--color-primary)]">Thích</button>
                            </div>
                        </div>
                    </div>
                ))}

                {comments.length === 0 && (
                    <div className="text-center text-slate-400 italic py-8">
                        Chưa có bình luận nào. Hãy là người đầu tiên!
                    </div>
                )}
            </div>
        </div>
    );
}
