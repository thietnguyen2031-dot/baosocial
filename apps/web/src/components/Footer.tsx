import { ArrowRight, Mail } from "lucide-react";
import { getSettings } from "@/lib/api";

export default async function Footer() {
    const settings = await getSettings();
    const copyright = settings?.footer_text || "© 2024 BaoSocial. All rights reserved.";
    const socialLinks = settings?.footer_links ? JSON.parse(settings.footer_links) : [];
    const companyName = settings?.company_name || "Truyền Thông Bến Thành";
    const license = settings?.company_license || "Giấy phép ĐKKD số 0315153320 cấp ngày 10/07/2018 Tại SKHĐT Thành Phố Hồ Chí Minh.";
    const editor = settings?.company_editor || "Nhà Báo Duy Mạnh";
    const office = settings?.company_office || "61 Đường số 7, KĐT Vạn Phúc, Thành Phố Hồ Chí Minh";
    const hotline = settings?.company_hotline || "0949366966";
    const email = settings?.company_email || "nbnguyenduymanh@gmail.com";

    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
            <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Company Info - Center/Left */}
                    <div className="lg:col-span-8 text-center lg:text-left space-y-2 text-sm leading-relaxed">
                        <h4 className="text-white font-bold uppercase tracking-wider mb-4 text-base">{companyName}</h4>
                        <p>{license}</p>
                        <p>Chủ biên: <span className="text-white font-medium">{editor}</span></p>
                        <p>Văn phòng: {office}</p>
                        <p>Quảng cáo - viết bài PR: <span className="text-white font-medium">{hotline}</span></p>
                        <p>Email: <a href={`mailto:${email}`} className="text-[var(--color-primary)] hover:underline">{email}</a></p>
                        <p className="pt-4 text-xs text-slate-500">{copyright}</p>
                        {socialLinks.length > 0 && (
                            <div className="flex gap-4 mt-4 justify-center lg:justify-start">
                                {socialLinks.map((link: any, idx: number) => (
                                    <a key={idx} href={link.url} target="_blank" className="text-slate-400 hover:text-white transition-colors">
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Newsletter - Compact Column */}
                    <div className="lg:col-span-4 bg-slate-800/50 rounded-xl p-6 border border-white/5">
                        <h5 className="text-white font-bold mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                            Đăng ký bản tin BaoSocial
                        </h5>
                        <p className="text-xs text-slate-400 mb-4">Nhận tin nóng và bài viết chuyên sâu.</p>

                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email của bạn..."
                                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                            />
                            <button className="bg-[var(--color-primary)] hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </footer>
    );
}
