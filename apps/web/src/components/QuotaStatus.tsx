'use client';

import { useState, useEffect } from 'react';
import { Zap, Key, RefreshCw, Clock } from 'lucide-react';

interface KeyQuota {
    keyIndex: number;
    keySuffix: string;
    gemini3Available: boolean;
    gemini25Available: boolean;
    articlesRemaining: number;
    articlesTotal: number;
    nextResetAt: number;
}

interface QuotaData {
    totalKeys: number;
    totalRemaining: number;
    totalCapacity: number;
    nextResetAt: number;
    keys: KeyQuota[];
}

export default function QuotaStatus() {
    const [data, setData] = useState<QuotaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const fetchQuota = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/quota-status`, {
                cache: 'no-store'
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error('Failed to fetch quota', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuota();
        const interval = setInterval(fetchQuota, 60000); // Refresh every 60s
        return () => clearInterval(interval);
    }, []);

    const formatResetTime = (ms: number) => {
        const date = new Date(ms);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
        );
    }

    if (!data || data.totalKeys === 0) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-400 text-sm flex items-center gap-2">
                <Key size={16} />
                <span>Chưa cấu hình API Key Gemini</span>
            </div>
        );
    }

    const usedPercent = Math.round(((data.totalCapacity - data.totalRemaining) / data.totalCapacity) * 100);
    const remainingPercent = 100 - usedPercent;

    const barColor = remainingPercent > 50
        ? 'bg-emerald-500'
        : remainingPercent > 20
            ? 'bg-amber-500'
            : 'bg-red-500';

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
            {/* Header Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Zap size={14} className="text-cyan-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">Quota API Gemini hôm nay</span>
                </div>
                <button
                    onClick={fetchQuota}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    title="Làm mới"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Main Counter */}
            <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold tabular-nums ${remainingPercent > 50 ? 'text-emerald-400' : remainingPercent > 20 ? 'text-amber-400' : 'text-red-400'}`}>
                    {data.totalRemaining}
                </span>
                <span className="text-slate-400 text-sm pb-1">/ {data.totalCapacity} bài còn lại</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${remainingPercent}%` }}
                />
            </div>

            {/* Summary Row */}
            <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                    <Key size={11} />
                    <span>{data.totalKeys} API key × 40 bài/key/ngày</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>Reset lúc {formatResetTime(data.nextResetAt)}</span>
                </div>
            </div>

            {/* Per-key toggle */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
                {expanded ? '▲ Ẩn chi tiết' : '▼ Xem từng key'}
            </button>

            {/* Per-key Details */}
            {expanded && (
                <div className="space-y-2 mt-1">
                    {data.keys.map((key) => (
                        <div key={key.keyIndex} className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                            <div className="flex-shrink-0 text-xs text-slate-500 font-mono w-6 text-center">
                                #{key.keyIndex}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-slate-300 font-mono mb-1">{key.keySuffix}</div>
                                <div className="flex gap-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${key.gemini3Available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-500 line-through'}`}>
                                        G3-Flash
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${key.gemini25Available ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600 text-slate-500 line-through'}`}>
                                        G2.5-Flash
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold ${key.articlesRemaining > 0 ? 'text-slate-200' : 'text-red-400'}`}>
                                    {key.articlesRemaining}
                                </div>
                                <div className="text-[10px] text-slate-500">bài còn lại</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
