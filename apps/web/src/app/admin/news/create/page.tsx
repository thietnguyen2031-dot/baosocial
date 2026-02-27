'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Check, Globe, AlertCircle } from 'lucide-react'; // Fixed imports
import Link from 'next/link';

// Helper components (Duplicated from Edit page for independence, or could be shared)
function CheckCircle({ className }: any) { return <Check className={className} /> }
function XCircle({ className }: any) { return <AlertCircle className={className} /> }
function GlobeSearch() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
    )
}

function calculateSEOScore(data: any) {
    let score = 100;
    if (!data.slug || data.slug.length > 70) score -= 10;
    if (data.seoTitle && data.seoTitle.length > 70) score -= 10;
    if (!data.seoDescription || data.seoDescription.length > 160) score -= 10;
    if (data.contentAi && !data.contentAi.includes('<h2>') && !data.contentAi.includes('<h3>') && data.contentAi.length > 500) score -= 10;
    return Math.max(0, score);
}

function SEOScoreCard({ data }: { data: any }) {
    const score = calculateSEOScore(data);
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
                        {check.valid ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        <span className={check.valid ? 'text-slate-700' : 'text-red-600 font-medium'}>{check.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function CreateArticlePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        summary: '',
        contentAi: '',
        seoTitle: '',
        seoDescription: '',
        focusKeyword: '',
        status: 'PENDING',
        category: 'Tin Tức' // Default category
    });

    // Auto-generate slug from title if empty
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: prev.slug || title.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
                .trim().replace(/\s+/g, '-') // Space to dash
        }));
    };

    const handleSave = async (status: string) => {
        if (!formData.title || !formData.slug) return alert("Vui lòng nhập tiêu đề và slug");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, status })
            });

            if (!res.ok) throw new Error('Failed to create');

            alert('Tạo tin mới thành công!');
            router.push('/admin/news');
            router.refresh();
        } catch (e) {
            alert('Lỗi khi tạo tin');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/news" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-900">Thêm tin mới</h1>
                        <p className="text-slate-500">Soạn thảo bài viết mới</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleSave('PENDING')} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold">Lưu nháp</button>
                    <button onClick={() => handleSave('PUBLISHED')} className="px-6 py-2 bg-[var(--color-primary)] hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <Check size={18} /> Xuất bản
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề (H1)</label>
                        <input
                            value={formData.title}
                            onChange={handleTitleChange}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                            placeholder="Nhập tiêu đề bài viết..."
                        />

                        <label className="block text-sm font-bold text-slate-700 mt-4 mb-2">Chuyên mục</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="Tin Tức">Tin Tức</option>
                            <option value="Kinh Tế">Kinh Tế</option>
                            <option value="Xã Hội">Xã Hội</option>
                            <option value="Công Nghệ">Công Nghệ</option>
                            <option value="Giải Trí">Giải Trí</option>
                        </select>
                    </div>

                    {/* Content & AI */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung</label>
                        <textarea
                            rows={15}
                            value={formData.contentAi}
                            onChange={(e) => setFormData({ ...formData, contentAi: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nội dung bài viết..."
                        />
                        <div className="mt-4 flex justify-end">
                            {/* AI Suggest UI reused */}
                            <button
                                type="button"
                                id="btn-seo-suggest-create"
                                onClick={async () => {
                                    if (!formData.title || !formData.contentAi) return alert("Cần có tiêu đề và nội dung!");
                                    const btn = document.getElementById('btn-seo-suggest-create');
                                    if (btn) btn.innerText = "🤖 Đang xử lý...";
                                    try {
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/seo-suggestions`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ title: formData.title, content: formData.contentAi })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error);
                                        setFormData(prev => ({
                                            ...prev,
                                            title: data.suggestedTitle,
                                            seoDescription: data.metaDescription,
                                            slug: data.slug,
                                            contentAi: data.rewrittenContent
                                        }));
                                        alert("✅ AI đã gợi ý xong!");
                                    } catch (e: any) { alert("❌ " + e.message); }
                                    finally { if (btn) btn.innerText = "✨ Gợi ý SEO (AI)"; }
                                }}
                                className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors border border-purple-200"
                            >
                                ✨ Gợi ý SEO (AI)
                            </button>
                        </div>
                    </div>

                    {/* SEO Config */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <GlobeSearch /> Cấu hình SEO
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                                <textarea rows={3} value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <SEOScoreCard data={formData} />
                </div>
            </div>
        </div>
    );
}
