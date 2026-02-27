'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Check, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ArticleEditorPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        summary: '',
        contentAi: '',
        seoTitle: '',
        seoDescription: '',
        focusKeyword: '',
        status: 'PENDING'
    });

    useEffect(() => {
        if (id) fetchArticle();
    }, [id]);

    const fetchArticle = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/articles/${id}`);
            const data = await res.json();
            if (data.id) {
                setFormData({
                    title: data.title || '',
                    slug: data.slug || '',
                    summary: data.summary || '',
                    contentAi: data.contentAi || data.summary || '', // Fallback content
                    seoTitle: data.seoTitle || data.title || '',
                    seoDescription: data.seoDescription || data.summary || '',
                    focusKeyword: data.focusKeyword || '',
                    status: data.status || 'PENDING'
                });
            }
        } catch (e) {
            alert('Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (newStatus?: string) => {
        const statusToSave = newStatus || formData.status;

        // Validate SEO before publish
        if (statusToSave === 'PUBLISHED') {
            const score = calculateSEOScore(formData);
            if (score < 80) {
                if (!confirm(`Điểm SEO chỉ đạt ${score}/100. Bạn có chắc muốn xuất bản không?`)) return;
            }
        }

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/articles/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, status: statusToSave })
            });
            alert('Đã lưu thành công!');
            router.push('/admin/news');
            router.refresh();
        } catch (e) {
            alert('Lỗi khi lưu');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải editor...</div>;

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/news" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-900">Biên tập bài viết</h1>
                        <div className="flex gap-2 text-sm mt-1">
                            <span className={`font-bold ${formData.status === 'PUBLISHED' ? 'text-green-600' : 'text-orange-600'}`}>
                                {formData.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleSave('PENDING')}
                        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition-colors"
                    >
                        Lưu nháp
                    </button>
                    <button
                        onClick={() => handleSave('PUBLISHED')}
                        className="px-6 py-2 bg-[var(--color-primary)] hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <Check size={18} /> Xuất bản
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Editor Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề (H1)</label>
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                        />
                        <p className="text-xs text-slate-400 mt-1 text-right">{formData.title.length}/70 ký tự</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung (Content)</label>
                        <textarea
                            rows={15}
                            value={formData.contentAi}
                            onChange={(e) => setFormData({ ...formData, contentAi: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nội dung bài viết..."
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                id="btn-seo-suggest"
                                onClick={async () => {
                                    if (!formData.title || !formData.contentAi) {
                                        return alert("Vui lòng nhập tiêu đề và nội dung trước khi dùng AI!");
                                    }

                                    const btn = document.getElementById('btn-seo-suggest');
                                    if (btn) btn.innerText = "🤖 Đang tạo gợi ý SEO...";

                                    try {
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/seo-suggestions`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                title: formData.title,
                                                content: formData.contentAi
                                            })
                                        });
                                        const data = await res.json();

                                        if (!res.ok) {
                                            throw new Error(data.error || "Lỗi xử lý AI");
                                        }

                                        // Auto-fill all fields
                                        setFormData(prev => ({
                                            ...prev,
                                            title: data.suggestedTitle,
                                            seoTitle: data.suggestedTitle,
                                            seoDescription: data.metaDescription,
                                            slug: data.slug,
                                            contentAi: data.rewrittenContent
                                        }));

                                        alert("✅ Gợi ý SEO thành công!\n\nĐã cập nhật:\n• Tiêu đề\n• Mô tả SEO\n• URL Slug\n• Nội dung");
                                    } catch (e: any) {
                                        alert("❌ " + e.message);
                                    } finally {
                                        if (btn) btn.innerText = "✨ Gợi ý SEO (AI)";
                                    }
                                }}
                                className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors border border-purple-200"
                            >
                                ✨ Gợi ý SEO (AI)
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <GlobeSearch /> Cấu hình SEO (Metadata)
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
                                <input
                                    value={formData.seoTitle}
                                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                <div className="flex items-center">
                                    <span className="bg-slate-100 px-3 py-2 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 text-sm">/tin/</span>
                                    <input
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.seoDescription}
                                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">{formData.seoDescription.length}/160 ký tự</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SEO Scorecard (Option C) */}
                <div className="lg:col-span-1">
                    <SEOScoreCard data={formData} />
                </div>
            </div>
        </div>
    );
}

// Option C: SEO Logic
function calculateSEOScore(data: any) {
    let score = 100;
    if (!data.slug || data.slug.length > 70) score -= 10;
    if (data.seoTitle.length > 70) score -= 10;
    if (!data.seoDescription || data.seoDescription.length > 160) score -= 10;
    if (!data.contentAi.includes('<h2>') && !data.contentAi.includes('<h3>') && data.contentAi.length > 500) score -= 10; // Basic check structure
    // More rules...
    return Math.max(0, score);
}

function SEOScoreCard({ data }: { data: any }) {
    const score = calculateSEOScore(data);

    // Validations
    const checks = [
        { label: "Tiêu đề chuẩn SEO (< 70 ký tự)", valid: data.seoTitle && data.seoTitle.length <= 70 },
        { label: "Có Meta Description", valid: !!data.seoDescription },
        { label: "Description độ dài tốt (< 160 ký tự)", valid: data.seoDescription && data.seoDescription.length <= 160 },
        { label: "URL ngắn gọn, không có ký tự lạ", valid: /^[a-z0-9-]+$/.test(data.slug) },
        { label: "Nội dung có độ dài > 300 từ", valid: data.contentAi && data.contentAi.length > 300 },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Điểm chuẩn SEO</h3>

            <div className="flex items-center justify-center mb-6">
                <div className={`relative w-32 h-32 rounded-full border-8 flex items-center justify-center ${score >= 80 ? 'border-green-500 text-green-600' : score >= 50 ? 'border-orange-400 text-orange-500' : 'border-red-500 text-red-600'}`}>
                    <span className="text-4xl font-black">{score}</span>
                </div>
            </div>

            <div className="space-y-3">
                {checks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                        {check.valid ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <span className={check.valid ? 'text-slate-700' : 'text-red-600 font-medium'}>
                            {check.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Gợi ý:</strong> {score < 100 ? "Hãy tối ưu lại các mục báo đỏ để đạt điểm tối đa và lên Top Google!" : "Bài viết đã chuẩn SEO. Sẵn sàng xuất bản!"}
            </div>
        </div>
    );
}

function GlobeSearch() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
    )
}
function CheckCircle({ className }: any) { return <Check className={className} /> }
function XCircle({ className }: any) { return <AlertCircle className={className} /> }
