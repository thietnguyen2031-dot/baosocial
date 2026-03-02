"use client";

import { useEffect, useState } from "react";
import { Layout, MessageSquare, Bot, Globe } from "lucide-react";

export default function SettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("general");

    // Form states
    const [headerLogo, setHeaderLogo] = useState("");
    const [footerText, setFooterText] = useState("");
    const [footerLinks, setFooterLinks] = useState("");
    const [apiKeys, setApiKeys] = useState("");
    const [telegramConfig, setTelegramConfig] = useState("");
    const [telegramApproval, setTelegramApproval] = useState(false);
    const [autoCrawlInterval, setAutoCrawlInterval] = useState("30");

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/settings`)
            .then((res) => res.json())
            .then((data) => {
                setSettings(data);
                const map = (key: string) => data.find((s: any) => s.key === key)?.value || "";
                setHeaderLogo(map("header_logo"));
                setFooterText(map("footer_text"));
                setFooterLinks(map("footer_links"));
                setApiKeys(map("gemini_api_keys"));
                setTelegramConfig(map("telegram_config"));
                setTelegramApproval(map("telegram_approval_enabled") === "true");
                setAutoCrawlInterval(map("auto_crawl_interval_minutes") || "30");
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (key: string, value: string, description: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value, description }),
            });
            if (res.ok) alert("Đã lưu!");
        } catch (error) {
            alert("Lỗi khi lưu");
        }
    };

    if (loading) return <div>Loading...</div>;

    const tabs = [
        { id: "general", label: "Chung & Header", icon: Globe },
        { id: "footer", label: "Footer & Liên hệ", icon: Layout },
        { id: "telegram", label: "Telegram Bot", icon: MessageSquare },
        { id: "ai", label: "AI & Gemini", icon: Bot },
    ];

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Cài đặt hệ thống</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? "border-slate-900 text-slate-900"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
                {/* General Tab */}
                {activeTab === "general" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold mb-4">Cấu hình chung</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Logo Text / URL</label>
                            <div className="flex gap-2">
                                <input
                                    value={headerLogo}
                                    onChange={(e) => setHeaderLogo(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 ring-blue-500 outline-none"
                                    placeholder="BaoSocial"
                                />
                                <button
                                    onClick={() => handleSave("header_logo", headerLogo, "Header Logo")}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-2">Cấu hình Crawler</h3>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                ⏰ <strong>Lịch crawl tự động</strong> hiện được cấu hình theo từng luồng tin riêng lẻ.<br />
                                Vào trang <a href="/admin/crawler" className="underline font-semibold">Cấu hình Crawler</a> → sửa luồng → đặt "Phút crawl tự động" (0–59) cho từng luồng.
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Tab */}
                {activeTab === "footer" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold mb-4">Footer & Thông tin công ty</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingInput label="Tên Công Ty" value={settings.find((s: any) => s.key === "company_name")?.value || ""} onChange={(v) => handleSave("company_name", v, "Company Name")} />
                            <SettingInput label="Giấy Phép" value={settings.find((s: any) => s.key === "company_license")?.value || ""} onChange={(v) => handleSave("company_license", v, "License Info")} />
                            <SettingInput label="Chủ Biên" value={settings.find((s: any) => s.key === "company_editor")?.value || ""} onChange={(v) => handleSave("company_editor", v, "Editor Name")} />
                            <SettingInput label="Hotline" value={settings.find((s: any) => s.key === "company_hotline")?.value || ""} onChange={(v) => handleSave("company_hotline", v, "Hotline")} />
                            <SettingInput label="Email" value={settings.find((s: any) => s.key === "company_email")?.value || ""} onChange={(v) => handleSave("company_email", v, "Email")} />
                        </div>
                        <SettingInput label="Văn Phòng" value={settings.find((s: any) => s.key === "company_office")?.value || ""} onChange={(v) => handleSave("company_office", v, "Office")} />

                        <div className="pt-4 border-t border-slate-100">
                            <SettingInput label="Copyright Text" value={footerText} onChange={(v) => handleSave("footer_text", v, "Copyright")} />
                            <div className="mt-4">
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Social Links</label>
                                    <SocialLinksEditor value={footerLinks} onChange={(v) => handleSave("footer_links", v, "Social Links")} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Telegram Tab */}
                {activeTab === "telegram" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold mb-4">Cấu hình Telegram Bot</h2>

                        {/* Telegram Approval Toggle */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        🔔 Telegram Approval Mode
                                    </h3>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {telegramApproval
                                            ? "✅ BẬT: Tất cả tin mới → CHỜ DUYỆT (cần duyệt qua Telegram)"
                                            : "⚡ TẮT: Tin AI thành công → TỰ ĐỘNG XUẤT BẢN"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const newValue = !telegramApproval;
                                        setTelegramApproval(newValue);
                                        handleSave("telegram_approval_enabled", String(newValue), "Telegram Approval Mode");
                                    }}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${telegramApproval ? 'bg-green-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${telegramApproval ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <div className="text-xs text-slate-500 bg-white p-2 rounded mt-2">
                                💡 <strong>Lưu ý:</strong> Khi BẬT, mọi tin sync đều cần duyệt thủ công qua Telegram trước khi xuất bản.
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                            1. Tạo Bot qua @BotFather lấy Token.<br />
                            2. Add Bot vào nhóm và lấy Chat ID.<br />
                            3. Cấu hình JSON bên dưới:
                        </div>

                        <TelegramConfigEditor
                            value={telegramConfig}
                            onChange={(v) => {
                                setTelegramConfig(v);
                                handleSave("telegram_config", v, "Telegram Config");
                            }}
                        />
                        <p className="text-xs text-slate-500 font-mono mt-1">
                            Format: {"{\"token\": \"...\", \"defaultChatId\": \"...\", \"routing\": {\"Kinh Tế\": \"...\"}}"}
                        </p>
                    </div>
                )}

                {/* AI Tab */}
                {activeTab === "ai" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold mb-4">Cấu hình AI (Gemini)</h2>
                        <SettingInput
                            label="Danh sách API Keys (Mỗi key một dòng)"
                            value={apiKeys}
                            onChange={(v) => handleSave("gemini_api_keys", v, "Gemini Keys")}
                            isJson={true}
                        />
                        <p className="text-xs text-slate-500">Hệ thống sẽ tự động xoay vòng keys.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ... component implementations

function SocialLinksEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [links, setLinks] = useState<{ label: string; url: string }[]>([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(value || "[]");
            if (Array.isArray(parsed)) setLinks(parsed);
        } catch (e) {
            setLinks([]);
        }
    }, [value]);

    const handleChange = (index: number, field: "label" | "url", val: string) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], [field]: val };
        setLinks(newLinks);
    };

    const addLink = () => setLinks([...links, { label: "", url: "" }]);
    const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
    const save = () => onChange(JSON.stringify(links));

    return (
        <div className="space-y-3">
            {links.map((link, i) => (
                <div key={i} className="flex gap-2">
                    <input
                        placeholder="Label (e.g. Facebook)"
                        value={link.label}
                        onChange={(e) => handleChange(i, "label", e.target.value)}
                        className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                        placeholder="URL (https://...)"
                        value={link.url}
                        onChange={(e) => handleChange(i, "url", e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <button onClick={() => removeLink(i)} className="text-red-500 hover:text-red-700 px-2">X</button>
                </div>
            ))}
            <div className="flex gap-2">
                <button onClick={addLink} className="text-sm text-blue-600 hover:underline">+ Thêm Link</button>
                <button onClick={save} className="ml-auto px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">Lưu Social Links</button>
            </div>
        </div>
    );
}

function TelegramConfigEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [config, setConfig] = useState({ token: "", defaultChatId: "", routing: {} as Record<string, string> });

    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        // Fetch categories when component mounts
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/categories`)
            .then(res => res.json())
            .then(data => Array.isArray(data) && setCategories(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        try {
            const parsed = JSON.parse(value || "{}");
            setConfig({
                token: parsed.token || "",
                defaultChatId: parsed.defaultChatId || "",
                routing: parsed.routing || {}
            });
        } catch (e) {
            // ignore
        }
    }, [value]);

    const updateRouting = (key: string, val: string) => {
        setConfig(prev => ({ ...prev, routing: { ...prev.routing, [key]: val } }));
    };

    const removeRouting = (key: string) => {
        const newRouting = { ...config.routing };
        delete newRouting[key];
        setConfig(prev => ({ ...prev, routing: newRouting }));
    };

    const save = () => onChange(JSON.stringify(config));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Bot Token</label>
                    <input
                        value={config.token}
                        onChange={(e) => setConfig({ ...config, token: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                        placeholder="123456:ABC-DEF..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Token nhận từ @BotFather</p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Default Chat ID</label>
                    <input
                        value={config.defaultChatId}
                        onChange={(e) => setConfig({ ...config, defaultChatId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                        placeholder="-100xxxxxxx"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">ID nhóm mặc định (-100...). Add bot vào nhóm rồi gõ /myid</p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Routing (Phân loại tin theo chuyên mục)</label>
                <p className="text-xs text-slate-500 mb-2">Nhập tên chuyên mục (chính xác) và Chat ID riêng nếu muốn gửi tin của chuyên mục đó vào nhóm khác.</p>
                <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                    {Object.entries(config.routing).map(([cat, chatId]) => (
                        <div key={cat} className="flex gap-2 items-center">
                            <input
                                value={cat}
                                readOnly
                                className="w-1/3 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600 cursor-not-allowed"
                            />
                            <span className="text-slate-400">→</span>
                            <input
                                value={chatId}
                                onChange={(e) => updateRouting(cat, e.target.value)}
                                className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm font-mono"
                                placeholder="-100xxxx"
                            />
                            <button onClick={() => removeRouting(cat)} className="text-red-500 hover:text-red-700 px-2">X</button>
                        </div>
                    ))}

                    <div className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-dashed border-slate-300">
                        <select id="newCat" className="w-1/3 px-3 py-1 border border-slate-300 rounded text-sm">
                            <option value="">Chọn chuyên mục...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <input id="newChatId" placeholder="Chat ID (-100xxxx)" className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm font-mono" />
                        <button
                            onClick={() => {
                                const cat = (document.getElementById("newCat") as HTMLSelectElement).value;
                                const id = (document.getElementById("newChatId") as HTMLInputElement).value;
                                if (cat && id) {
                                    updateRouting(cat, id);
                                    (document.getElementById("newCat") as HTMLSelectElement).value = "";
                                    (document.getElementById("newChatId") as HTMLInputElement).value = "";
                                }
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                        >
                            + Thêm
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button onClick={save} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium">Lưu Cấu Hình Telegram</button>
            </div>
        </div>
    );
}

function SettingInput({ label, value, onChange, isJson = false }: { label: string, value: string, onChange: (val: string) => void, isJson?: boolean }) {
    const [localValue, setLocalValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { setLocalValue(value); }, [value]);

    const save = async () => {
        setIsSaving(true);
        await onChange(localValue);
        setIsSaving(false);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="flex gap-2">
                {isJson ? (
                    <textarea
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 ring-blue-500 outline-none font-mono text-sm h-32"
                    />
                ) : (
                    <input
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 ring-blue-500 outline-none"
                    />
                )}
                <button
                    onClick={save}
                    disabled={isSaving}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium h-fit disabled:opacity-50"
                >
                    {isSaving ? "..." : "Lưu"}
                </button>
            </div>
        </div>
    );
}
