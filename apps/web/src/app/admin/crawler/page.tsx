'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, Save, MousePointerClick, Pencil, X } from 'lucide-react';
import { VisualSelector, type SelectorMode } from '@/components/admin/VisualSelector';

interface Feed {
    id: number;
    url: string;
    source: string;
    category: string;
    isActive: boolean;
    contentSelector?: string;
    excludeSelector?: string;
    titleSelector?: string;
    descriptionSelector?: string;
    autoSeo?: boolean;
}

export default function CrawlerConfigPage() {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(true);

    // New Feed Form
    const [url, setUrl] = useState('');
    const [source, setSource] = useState('');
    const [category, setCategory] = useState('Kinh Tế');

    // Selectors
    const [contentSelector, setContentSelector] = useState('');
    const [excludeSelector, setExcludeSelector] = useState('');
    const [titleSelector, setTitleSelector] = useState('');
    const [descriptionSelector, setDescriptionSelector] = useState('');
    const [autoSeo, setAutoSeo] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);

    // Visual Selector State
    const [isVisualSelectorOpen, setIsVisualSelectorOpen] = useState(false);
    const [targetField, setTargetField] = useState<SelectorMode | null>(null);

    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        fetchFeeds();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:3001/categories');
            const data = await res.json();
            if (Array.isArray(data)) setCategories(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchFeeds = async () => {
        try {
            const res = await fetch('http://localhost:3001/rss-feeds');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFeeds(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (feed: Feed) => {
        setEditingId(feed.id);
        setUrl(feed.url);
        setSource(feed.source);
        setCategory(feed.category);
        setContentSelector(feed.contentSelector || '');
        setExcludeSelector(feed.excludeSelector || '');
        setTitleSelector(feed.titleSelector || '');
        setDescriptionSelector(feed.descriptionSelector || '');
        setAutoSeo(feed.autoSeo || false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setUrl('');
        setSource('');
        setContentSelector('');
        setExcludeSelector('');
        setTitleSelector('');
        setDescriptionSelector('');
        setAutoSeo(false);
    };

    const handleAddString = async () => {
        if (!url || !source) {
            alert("Vui lòng nhập đầy đủ RSS URL và Nguồn tin!");
            return;
        }

        try {
            const method = editingId ? 'PUT' : 'POST';
            const endpoint = editingId ? `http://localhost:3001/rss-feeds/${editingId}` : 'http://localhost:3001/rss-feeds';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url, source, category,
                    contentSelector, excludeSelector,
                    titleSelector, descriptionSelector,
                    autoSeo
                })
            });
            if (res.ok) {
                alert(editingId ? "Cập nhật thành công! ✅" : "Đã lưu nguồn tin thành công! ✅");
                handleCancelEdit();
                fetchFeeds();
            } else {
                const err = await res.json();
                alert(`Lỗi khi lưu: ${err.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Không thể kết nối đến API. Hãy kiểm tra server (PORT 3001).');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa nguồn này?')) return;
        try {
            await fetch(`http://localhost:3001/rss-feeds/${id}`, { method: 'DELETE' });
            fetchFeeds();
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const openVisualSelector = (field: SelectorMode) => {
        if (!url) {
            alert("Vui lòng nhập RSS URL hoặc link bài viết mẫu trước!");
            return;
        }
        setTargetField(field);
        setIsVisualSelectorOpen(true);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {isVisualSelectorOpen && targetField && (
                <VisualSelector
                    url={url}
                    mode={targetField}
                    onConfirm={(selector) => {
                        console.log(`[VisualSelector] Confirmed for ${targetField}:`, selector);
                        if (targetField === 'TITLE') {
                            setTitleSelector(selector);
                        } else if (targetField === 'DESCRIPTION') {
                            setDescriptionSelector(selector);
                        } else if (targetField === 'CONTENT') {
                            setContentSelector(selector);
                        } else if (targetField === 'EXCLUDE') {
                            setExcludeSelector(selector);
                        }
                        setIsVisualSelectorOpen(false);
                    }}
                    onCancel={() => setIsVisualSelectorOpen(false)}
                />
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-display text-slate-900">Cấu hình Crawler</h1>
                    <p className="text-slate-500">Quản lý các nguồn tin RSS tự động</p>
                </div>
                <div className="flex gap-3">
                    {/* <AutoSeoToggle /> Removed Global Toggle */}
                    <button
                        onClick={fetchFeeds}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Add New Feed Card */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border mb-8 ${editingId ? 'border-orange-200 ring-4 ring-orange-50' : 'border-slate-200'}`}>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    {editingId ? <Pencil className="w-5 h-5 text-orange-500" /> : <Plus className="w-5 h-5 text-[var(--color-primary)]" />}
                    {editingId ? 'Cập nhật cấu hình' : 'Thêm nguồn tin mới'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">RSS URL / Link bài mẫu</label>
                        <div className="flex gap-2">
                            <input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://vnexpress.net/..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn (Source)</label>
                        <input
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="VnExpress"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Chuyên mục</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                            {categories.length === 0 && <option value="Kinh Tế">Kinh Tế (Mặc định)</option>}
                        </select>
                    </div>
                </div>

                {/* AI / SEO Options */}
                <div className="mb-6 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="autoSeo"
                        checked={autoSeo}
                        onChange={(e) => setAutoSeo(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="autoSeo" className="text-sm font-medium text-slate-700 cursor-pointer select-none flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">AI</span>
                        Tự động viết lại bài chuẩn SEO (Auto SEO)
                    </label>
                </div>

                {/* Advanced Selectors */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Cấu hình Selectors</div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Title Selector</label>
                                <div className="flex gap-2">
                                    <input
                                        value={titleSelector}
                                        onChange={(e) => setTitleSelector(e.target.value)}
                                        placeholder=".title-detail"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    />
                                    <button onClick={() => openVisualSelector('TITLE')} className="p-2 bg-violet-100 text-violet-600 rounded hover:bg-violet-200" title="Chọn tiêu đề"><MousePointerClick size={16} /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Description Selector</label>
                                <div className="flex gap-2">
                                    <input
                                        value={descriptionSelector}
                                        onChange={(e) => setDescriptionSelector(e.target.value)}
                                        placeholder=".description"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    />
                                    <button onClick={() => openVisualSelector('DESCRIPTION')} className="p-2 bg-amber-100 text-amber-600 rounded hover:bg-amber-200" title="Chọn mô tả"><MousePointerClick size={16} /></button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Content Selector (Quan trọng)</label>
                                <div className="flex gap-2">
                                    <input
                                        value={contentSelector}
                                        onChange={(e) => setContentSelector(e.target.value)}
                                        placeholder=".article-body"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    />
                                    <button onClick={() => openVisualSelector('CONTENT')} className="p-2 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200" title="Chọn nội dung"><MousePointerClick size={16} /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Exclude Selector</label>
                                <div className="flex gap-2">
                                    <input
                                        value={excludeSelector}
                                        onChange={(e) => setExcludeSelector(e.target.value)}
                                        placeholder=".ads, .related-news"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    />
                                    <button onClick={() => openVisualSelector('EXCLUDE')} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Chọn thành phần loại bỏ"><MousePointerClick size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                    {editingId && (
                        <button
                            onClick={handleCancelEdit}
                            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 flex items-center gap-2 font-medium"
                        >
                            <X size={18} /> Hủy
                        </button>
                    )}
                    <button
                        onClick={handleAddString}
                        disabled={loading}
                        className={`${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--color-primary)] hover:opacity-90'} text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium transition-colors`}
                    >
                        {editingId ? <Save size={18} /> : <Plus size={18} />}
                        {loading ? 'Đang xử lý...' : (editingId ? 'Cập nhật' : 'Thêm RSS Feed')}
                    </button>
                </div>
            </div>

            {/* List Feeds */}
            <div className="space-y-4">
                {feeds.map((feed) => (
                    <div key={feed.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">{feed.source}</span>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{feed.category}</span>
                                {feed.autoSeo && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold" title="Auto SEO Enabled">✨ AI SEO</span>}
                                {feed.contentSelector && <span className="opacity-50 text-xs" title="Custom Selectors Configured">⚙️</span>}
                            </div>
                            <div className="font-mono text-sm text-slate-600 truncate flex items-center gap-2">
                                <Globe size={14} />
                                <a href={feed.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{feed.url}</a>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => handleEdit(feed)}
                                className="p-2 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                                title="Sửa cấu hình"
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(feed.id)}
                                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors"
                                title="Xóa"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// function AutoSeoToggle removed
