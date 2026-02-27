'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export type SelectorMode = 'TITLE' | 'DESCRIPTION' | 'CONTENT' | 'EXCLUDE';

interface VisualSelectorProps {
    url: string;
    mode: SelectorMode;
    onConfirm: (selector: string) => void;
    onCancel: () => void;
}

interface FeedItem {
    title: string;
    link: string;
    date: string;
}

export function VisualSelector({ url, mode, onConfirm, onCancel }: VisualSelectorProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'SELECT_ARTICLE' | 'PICK_SELECTOR'>('SELECT_ARTICLE');

    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [targetUrl, setTargetUrl] = useState<string>('');
    const [feedChecked, setFeedChecked] = useState(false);

    // Current Selection State
    const [selectedSelectors, setSelectedSelectors] = useState<string[]>([]);
    const [hoveredSelector, setHoveredSelector] = useState<string>('');

    // Step 1: Check if it's a feed and load items
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setError(null);
            setFeedChecked(false);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/crawler/feed-preview?url=${encodeURIComponent(url)}`);
                if (res.ok) {
                    const items = await res.json();
                    if (Array.isArray(items) && items.length > 0) {
                        setFeedItems(items);
                        setStep('SELECT_ARTICLE');
                        setLoading(false);
                        setFeedChecked(true);
                        return;
                    }
                }
                // If not RSS, we still stay in SELECT_ARTICLE but we will render iframe in LINK_PICKER mode
                console.log("Not a feed, triggering Link Picker for:", url);
                setFeedItems([]);
                setStep('SELECT_ARTICLE');

            } catch (e: any) {
                setFeedItems([]);
                setStep('SELECT_ARTICLE');
            } finally {
                setFeedChecked(true);
                setLoading(false);
            }
        };
        init();
    }, [url]);

    // Send updates to iframe
    const updateIframeVisuals = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_SELECTION',
                selectors: selectedSelectors
            }, '*');
            iframeRef.current.contentWindow.postMessage({
                type: 'SET_MODE',
                mode: mode
            }, '*');
        }
    };

    useEffect(() => {
        if (step === 'PICK_SELECTOR') {
            updateIframeVisuals();
        }
    }, [selectedSelectors, mode, step]);

    const loadIframeContent = async (currentUrl: string, pickerType: 'LINK' | 'ELEMENT') => {
        if (!iframeRef.current || !currentUrl) return;

        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/crawler/preview?url=${encodeURIComponent(currentUrl)}`);
            if (!res.ok) throw new Error(`Failed to load`);
            const html = await res.text();

            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(html);

                const styles = `
                    <style>
                        .baosocial-hover {
                            outline: 2px dashed ${pickerType === 'LINK' ? '#2563eb' : '#3b82f6'} !important;
                            cursor: pointer !important;
                            background-color: ${pickerType === 'LINK' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.1)'} !important;
                            z-index: 9999;
                        }
                        .baosocial-selected-TITLE { outline: 2px solid #8b5cf6 !important; background-color: rgba(139, 92, 246, 0.2) !important; }
                        .baosocial-selected-DESCRIPTION { outline: 2px solid #f59e0b !important; background-color: rgba(245, 158, 11, 0.2) !important; }
                        .baosocial-selected-CONTENT { outline: 2px solid #10b981 !important; background-color: rgba(16, 185, 129, 0.2) !important; }
                        .baosocial-selected-EXCLUDE { outline: 2px solid #ef4444 !important; background-color: rgba(239, 68, 68, 0.4) !important; text-decoration: line-through; }
                    </style>
                `;

                const script = `
                    <script>
                        (function() {
                            let hovered = null;
                            let currentMode = '${mode}';
                            let pickerType = '${pickerType}';
                            let selectedSelectors = ${JSON.stringify(selectedSelectors)};

                            function getCssPath(el) {
                                if (!(el instanceof Element)) return;
                                var path = [];
                                while (el.nodeType === Node.ELEMENT_NODE) {
                                    var selector = el.nodeName.toLowerCase();
                                    if (el.id) {
                                        selector += '#' + el.id;
                                        path.unshift(selector);
                                        break;
                                    } else {
                                        var sib = el, nth = 1;
                                        while (sib = sib.previousElementSibling) {
                                            if (sib.nodeName.toLowerCase() == selector) nth++;
                                        }
                                        if (nth != 1) selector += ":nth-of-type("+nth+")";
                                    }
                                    path.unshift(selector);
                                    el = el.parentNode;
                                }
                                return path.join(" > ");
                            }

                            function getSmartSelector(el) {
                                if (el.id) return '#' + el.id;
                                if (el.className && typeof el.className === 'string' && el.className.trim()) {
                                    const classes = el.className.split(' ').filter(c => !c.startsWith('baosocial-'));
                                    if (classes.length > 0) return '.' + classes.join('.');
                                }
                                return getCssPath(el);
                            }

                            function highlightSelected() {
                                if (pickerType === 'LINK') return;
                                // Clear old
                                document.querySelectorAll('[class*="baosocial-selected-"]').forEach(el => {
                                    el.className = el.className.replace(/baosocial-selected-[A-Z]+/g, '').trim();
                                });

                                // Apply new
                                selectedSelectors.forEach(sel => {
                                    try {
                                        const els = document.querySelectorAll(sel);
                                        els.forEach(el => el.classList.add('baosocial-selected-' + currentMode));
                                    } catch(e) {}
                                });
                            }

                            window.addEventListener('message', (event) => {
                                if (event.data.type === 'UPDATE_SELECTION') {
                                    selectedSelectors = event.data.selectors;
                                    highlightSelected();
                                }
                                if (event.data.type === 'SET_MODE') {
                                    currentMode = event.data.mode;
                                    highlightSelected();
                                }
                            });

                            document.addEventListener('mouseover', function(e) {
                                e.stopPropagation();

                                let target = e.target;
                                if (pickerType === 'LINK') {
                                    // In Link Picker mode, primarily target links
                                    const link = target.closest('a');
                                    if (link) {
                                        target = link;
                                    } else {
                                        if (hovered) {
                                            hovered.classList.remove('baosocial-hover');
                                            hovered = null;
                                        }
                                        return;
                                    }
                                }

                                if (hovered && hovered !== target) {
                                    hovered.classList.remove('baosocial-hover');
                                }
                                hovered = target;
                                hovered.classList.add('baosocial-hover');

                                if (pickerType === 'LINK') {
                                     window.parent.postMessage({ type: 'HOVER_LINK', href: target.getAttribute('href') }, '*');
                                } else {
                                     window.parent.postMessage({ type: 'HOVER', selector: getSmartSelector(hovered) }, '*');
                                }
                            });

                            document.addEventListener('mouseout', function(e) {
                                e.stopPropagation();
                                if (hovered) {
                                    hovered.classList.remove('baosocial-hover');
                                    hovered = null;
                                }
                            });

                            document.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();

                                if (pickerType === 'LINK') {
                                    const link = e.target.closest('a');
                                    if (link) {
                                         window.parent.postMessage({ type: 'LINK_SELECTED', href: link.href }, '*');
                                    }
                                    return;
                                }

                                const selector = getSmartSelector(e.target);
                                window.parent.postMessage({ type: 'TOGGLE_SELECTION', selector: selector }, '*');
                            });

                            setTimeout(highlightSelected, 500);
                        })();
                    </script>
                `;
                doc.write(styles + script);
                doc.close();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Effect to Trigger Iframe Load
    useEffect(() => {
        if (step === 'PICK_SELECTOR' && targetUrl) {
            // Step 2: Content Picker
            loadIframeContent(targetUrl, 'ELEMENT');
        } else if (step === 'SELECT_ARTICLE' && feedChecked && feedItems.length === 0 && url) {
            // Step 1 Fallback: Link Picker (only if feed check done and no items found)
            loadIframeContent(url, 'LINK');
        }
    }, [step, targetUrl, feedChecked, feedItems.length, url]);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'HOVER') setHoveredSelector(e.data.selector);
            // Handle Link Selection from Step 1
            if (e.data.type === 'LINK_SELECTED') {
                handleSelectArticle(e.data.href);
            }
            // Handle Selector Toggle from Step 2
            if (e.data.type === 'TOGGLE_SELECTION') {
                const selector = e.data.selector;
                setSelectedSelectors(prev => {
                    if (prev.includes(selector)) {
                        return prev.filter(s => s !== selector);
                    } else {
                        // For TITLE and DESCRIPTION, we might want single select, but let's keep multi for flexibility
                        // Or should we enforce single for Title? Let's stick to multi-select behavior for consistency.
                        return [...prev, selector];
                    }
                });
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSelectArticle = (link: string) => {
        setTargetUrl(link);
        setSelectedSelectors([]); // Clear previous selections
        setStep('PICK_SELECTOR');
    };

    const handleConfirm = () => {
        const result = selectedSelectors.join(', ');
        console.log('[VisualSelector] Sending confirm:', result);
        onConfirm(result);
    };

    // Mode Display Config
    const MODE_CONFIG = {
        TITLE: { label: 'Chọn Tiêu đề', color: 'bg-violet-600', desc: 'Click vào tiêu đề bài viết' },
        DESCRIPTION: { label: 'Chọn Mô tả', color: 'bg-amber-500', desc: 'Click vào đoạn mô tả ngắn' },
        CONTENT: { label: 'Chọn Nội dung', color: 'bg-emerald-500', desc: 'Click để chọn các đoạn nội dung chính' },
        EXCLUDE: { label: 'Chọn Loại bỏ', color: 'bg-red-500', desc: 'Click vào quảng cáo, tin liên quan để loại bỏ' }
    };

    const currentConfig = MODE_CONFIG[mode] || { label: 'Unknown Mode', color: 'bg-gray-500', desc: '' };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white w-full h-[95vh] rounded-lg shadow-2xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="bg-slate-900 text-white p-3 shrink-0 border-b border-slate-700 flex justify-between items-center z-10 relative">
                    <div className="flex items-center gap-3">
                        {step === 'PICK_SELECTOR' && (
                            <button onClick={() => setStep('SELECT_ARTICLE')} className="hover:bg-slate-700 p-1 rounded transition-colors" title="Quay lại danh sách">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                                {step === 'SELECT_ARTICLE' ? 'Bước 1: Chọn bài mẫu' : (
                                    <>
                                        <span className={`px-2 py-0.5 rounded text-sm ${currentConfig.color}`}>{currentConfig.label}</span>
                                    </>
                                )}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {step === 'SELECT_ARTICLE'
                                    ? (feedItems.length > 0 ? 'Chọn từ danh sách RSS' : 'Click vào một bài viết trên trang để chọn làm mẫu')
                                    : currentConfig.desc}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        {step === 'PICK_SELECTOR' && (
                            <div className="text-xs font-mono text-slate-400 mr-4">
                                Đã chọn: <span className="text-white font-bold">{selectedSelectors.length}</span>
                                <button onClick={() => setSelectedSelectors([])} className="ml-2 text-red-400 hover:underline">Xóa hết</button>
                            </div>
                        )}
                        <button onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium">Hủy</button>
                        {step === 'PICK_SELECTOR' && (
                            <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium shadow-lg shadow-blue-900/50">
                                Xác nhận
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 relative bg-slate-100 overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/80 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <span className="text-slate-600 font-medium animate-pulse">Đang tải trang...</span>
                            </div>
                        </div>
                    )}

                    {!loading && step === 'SELECT_ARTICLE' && feedItems.length > 0 && (
                        <div className="h-full overflow-auto p-8">
                            <div className="max-w-3xl mx-auto space-y-3">
                                {feedItems.map((item, idx) => (
                                    <div key={idx} onClick={() => handleSelectArticle(item.link)} className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition-all border border-transparent hover:border-blue-500 group">
                                        <div className="font-bold text-slate-800 text-lg group-hover:text-blue-600 mb-1">{item.title}</div>
                                        <div className="text-xs text-slate-400">{item.link}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Render Iframe for Link Picker (Step 1 No RSS) OR Content Picker (Step 2) */}
                    <div className={(!loading && !error && (step === 'PICK_SELECTOR' || (step === 'SELECT_ARTICLE' && feedItems.length === 0))) ? 'block h-full' : 'hidden'}>
                        <iframe
                            ref={iframeRef}
                            className={`w-full h-full border-0 bg-white`}
                            sandbox="allow-same-origin allow-scripts"
                            title="Visual Selector"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
