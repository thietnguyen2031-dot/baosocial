'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Edit, Eye, CheckCircle, XCircle, Trash2, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Article {
    id: number;
    title: string;
    category: string;
    status: string;
    sourceUrl: string;
    publishedAt: string;
}

export default function ArticleManagementPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('PENDING');
    const [syncLogs, setSyncLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [syncStats, setSyncStats] = useState<{ total: number, aiSuccess: number, aiFail: number, mode: string } | null>(null);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const res = await fetch('http://localhost:3001/articles?status=all', {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            }); // Admin needs ALL articles
            const data = await res.json();
            if (Array.isArray(data)) {
                setArticles(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        setSyncLogs(['🔄 Bắt đầu đồng bộ...']);
        setSyncStats(null);
        setShowLogs(true);
        try {
            const res = await fetch('http://localhost:3001/sync-news', { method: 'POST' });
            const data = await res.json();
            if (data.debugLogs && Array.isArray(data.debugLogs)) {
                setSyncLogs(data.debugLogs);
            }
            if (data.stats) {
                setSyncStats(data.stats);
            }
            if (data.message) {
                setSyncLogs(prev => [...prev, `✅ ${data.message}`]);
            }
            fetchArticles();
        } catch (e) {
            setSyncLogs(prev => [...prev, '❌ Lỗi khi đồng bộ!']);
            setLoading(false);
        }
    };

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(a => a.id));
        }
    };

    const handleBulkAction = async (action: 'PUBLISH' | 'PENDING' | 'DELETE') => {
        if (!confirm(`Bạn có chắc muốn thực hiện thao tác này với ${selectedIds.length} bài viết?`)) return;

        setLoading(true);
        try {
            await Promise.all(selectedIds.map(async (id) => {
                if (action === 'DELETE') {
                    const res = await fetch(`http://localhost:3001/articles/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to delete');
                } else {
                    await fetch(`http://localhost:3001/articles/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: action === 'PUBLISH' ? 'PUBLISHED' : 'PENDING' })
                    });
                }
            }));

            setSelectedIds([]);
            await fetchArticles();
        } catch (e) {
            alert('Lỗi!');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAutoSeo = async () => {
        if (!confirm(`Bạn có chắc muốn chạy Auto SEO cho ${selectedIds.length} bài viết này? Quá trình này có thể mất vài phút.`)) return;

        setLoading(true);
        setSyncLogs(['🔄 Bắt đầu chạy Auto SEO hàng loạt...']);
        setShowLogs(true);
        setSyncStats(null);

        try {
            const res = await fetch('http://localhost:3001/ai/bulk-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleIds: selectedIds })
            });
            const data = await res.json();

            if (data.logs && Array.isArray(data.logs)) {
                setSyncLogs(prev => [...prev, ...data.logs]);
            }
            if (data.message) {
                setSyncLogs(prev => [...prev, `✅ ${data.message}`]);
            }

            setSelectedIds([]);
            await fetchArticles();
        } catch (e) {
            setSyncLogs(prev => [...prev, '❌ Lỗi khi chạy Auto SEO!']);
        } finally {
            setLoading(false);
        }
    };

    const filtered = articles.filter(a => a.status === filterStatus);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-display text-slate-900">Quản lý tin tức</h1>
                    <p className="text-slate-500">Duyệt và biên tập tin từ Crawler</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/news/create"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        + Thêm tin mới
                    </Link>
                    <button
                        onClick={handleSync}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-lg shadow-black/20"
                    >
                        <RefreshCw size={18} />
                        Đồng bộ tin mới
                    </button>
                </div>
            </div>

            {/* Sync Logs Viewer - ABOVE TABS */}
            {showLogs && (
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-2xl">📋</span> Nhật ký đồng bộ
                        </h2>
                        <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-4 bg-slate-900 font-mono text-sm">
                        {syncLogs.map((log, idx) => (
                            <div key={idx} className="text-green-400 mb-1 whitespace-pre-wrap">
                                {log}
                            </div>
                        ))}
                        {loading && <div className="text-yellow-400 animate-pulse">⏳ Đang xử lý...</div>}
                    </div>
                    {syncStats && (
                        <div className="p-4 border-t border-slate-200 bg-blue-50">
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-blue-600">{syncStats.total}</div>
                                    <div className="text-xs text-slate-600">📰 Tổng tin mới</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{syncStats.aiSuccess}</div>
                                    <div className="text-xs text-slate-600">✅ AI thành công</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-600">{syncStats.aiFail}</div>
                                    <div className="text-xs text-slate-600">❌ AI thất bại</div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700">{syncStats.mode === 'telegram' ? '📩 Telegram' : '⚡ Auto-Publish'}</div>
                                    <div className="text-xs text-slate-600">🔧 Chế độ</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="p-4 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-sm text-slate-500">{syncLogs.length} dòng log</span>
                        <button onClick={() => setShowLogs(false)} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Đóng</button>
                    </div>
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="font-bold text-blue-800">Đã chọn {selectedIds.length} bài viết</span>
                    <div className="flex gap-2">
                        {filterStatus === 'PENDING' && (
                            <button
                                onClick={handleBulkAutoSeo}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-purple-500/20"
                            >
                                <Sparkles size={16} /> Auto SEO
                            </button>
                        )}
                        <button
                            onClick={() => handleBulkAction('PUBLISH')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <CheckCircle size={16} /> Duyệt nhanh
                        </button>
                        <button
                            onClick={() => handleBulkAction('PENDING')}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <XCircle size={16} /> Gỡ bài
                        </button>
                        <button
                            onClick={() => handleBulkAction('DELETE')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Xóa
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => { setFilterStatus('PENDING'); setSelectedIds([]); }}
                    className={`pb-3 px-1 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${filterStatus === 'PENDING' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    CHỜ DUYỆT <span className="ml-2 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs">{articles.filter(a => a.status === 'PENDING').length}</span>
                </button>
                <button
                    onClick={() => { setFilterStatus('PUBLISHED'); setSelectedIds([]); }}
                    className={`pb-3 px-1 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${filterStatus === 'PUBLISHED' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    ĐÃ XUẤT BẢN <span className="ml-2 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs">{articles.filter(a => a.status === 'PUBLISHED').length}</span>
                </button>
            </div>

            {/* Article List */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <th className="px-6 py-4 w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300"
                                />
                            </th>
                            <th className="px-6 py-4">Tiêu đề</th>
                            <th className="px-6 py-4">Chuyên mục</th>
                            <th className="px-6 py-4">Ngày xuất bản</th>
                            <th className="px-6 py-4 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-500">Đang tải...</td></tr>
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-500">Không có bài viết nào</td></tr>
                        )}
                        {!loading && filtered.map((article) => (
                            <tr key={article.id} className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${selectedIds.includes(article.id) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(article.id)}
                                        onChange={() => toggleSelect(article.id)}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 line-clamp-2">{article.title}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-slate-200 text-slate-700">{article.category}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {new Date(article.publishedAt).toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link
                                            href={`/admin/news/${article.id}`}
                                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                        >
                                            <Edit size={18} />
                                        </Link>
                                        <Link
                                            href={`/news/${article.id}`}
                                            target="_blank"
                                            className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                        >
                                            <Eye size={18} />
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
                                                await fetch(`http://localhost:3001/articles/${article.id}`, { method: 'DELETE' });
                                                fetchArticles();
                                            }}
                                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
