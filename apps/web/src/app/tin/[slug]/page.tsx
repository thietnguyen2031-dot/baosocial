import { auth } from "@/auth";
import CommentSection from "@/components/CommentSection";
import SaveButton from "@/components/SaveButton";
import Image from "next/image";
import { notFound } from "next/navigation";
import { generateJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings, getRelatedArticles, getCategories } from "@/lib/api";
import Link from "next/link";
import FeaturedGrid from "@/components/FeaturedGrid";

// Fetch article by slug
async function getArticleBySlug(slug: string) {
    const res = await fetch(`http://localhost:3001/articles/by-slug/${slug}`, {
        next: { revalidate: 60 } // ISR: 60 seconds
    });
    if (!res.ok) return null;
    return res.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) return { title: 'Không tìm thấy bài viết' };

    return {
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.summary,
        openGraph: {
            title: article.seoTitle || article.title,
            description: article.seoDescription || article.summary,
            images: article.thumbnail ? [article.thumbnail] : [],
            type: 'article',
            publishedTime: article.publishedAt,
        },
    };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    const session = await auth();
    const settings = await getSettings();
    const categories = await getCategories(true);

    if (!article) {
        notFound();
    }

    const relatedNews = await getRelatedArticles(article.category, article.id);

    // Mapper for related news
    const mapNews = (item: any) => ({
        id: item.id || item.guid,
        slug: item.slug,
        title: item.title || '',
        summary: item.summary || item.description || '',
        thumbnail: item.thumbnail || item.enclosure || null,
        category: item.category || 'Chưa phân loại',
        publishedAt: item.publishedAt || item.pubDate || '',
    });

    const relatedMapped = (relatedNews || []).map(mapNews);
    const jsonLd = generateJsonLd(article);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
            <Header session={session} settings={settings} categories={categories} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT: Article Content */}
                    <div className="lg:col-span-8">
                        {/* Author & Published Date */}
                        <div className="flex items-center gap-4 mb-6 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {article.sourceUrl ? new URL(article.sourceUrl).hostname[0].toUpperCase() : 'B'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Ban Biên Tập</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(article.publishedAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Article Title */}
                        <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-6">
                            {article.title}
                        </h1>

                        {/* Article Body */}
                        <article className="prose prose-lg prose-slate max-w-none bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100">
                            {(!article.contentAi || !article.contentAi.includes(article.summary?.substring(0, 20))) && (
                                <p className="lead text-xl font-medium text-slate-700 mb-8 border-l-4 border-[var(--color-primary)] pl-5 italic">
                                    {article.summary}
                                </p>
                            )}

                            {article.thumbnail && (
                                <div className="relative w-full h-[400px] mb-8 rounded-xl overflow-hidden shadow-lg">
                                    <Image src={article.thumbnail} fill alt={article.title} className="object-cover" />
                                </div>
                            )}

                            <div className="content-body" dangerouslySetInnerHTML={{ __html: (article.contentAi || article.summary || "").replace(/\\n/g, '').replace(/\n/g, ' ') }} />

                            <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <SaveButton articleId={article.id} session={session} />
                                    <span className="text-slate-500 font-medium text-sm">Lưu tin này để đọc lại</span>
                                </div>

                                {article.sourceUrl && (
                                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                                        <span className="text-slate-500 text-sm font-medium">Nguồn:</span>
                                        <a href={article.sourceUrl} target="_blank" rel="nofollow noopener" className="text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1 text-sm">
                                            {new URL(article.sourceUrl).hostname}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </article>

                        {/* Comments Section */}
                        <div className="mt-12">
                            <CommentSection articleId={article.id} session={session} />
                        </div>
                    </div>

                    {/* RIGHT: Related Articles */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                Bài viết liên quan
                            </h2>

                            {relatedMapped.length === 0 ? (
                                <p className="text-slate-500 text-sm">Không có bài viết liên quan</p>
                            ) : (
                                <div className="space-y-4">
                                    {relatedMapped.slice(0, 5).map((item: any) => (
                                        <Link key={item.id} href={`/tin/${item.slug}`} className="flex gap-4 group hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                                            {item.thumbnail && (
                                                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                                    <Image src={item.thumbnail} fill alt={item.title} className="object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-slate-800 group-hover:text-[var(--color-primary)] line-clamp-2 transition-colors leading-snug">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(item.publishedAt).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                {/* More News Section */}
                <div className="mt-16">
                    <h2 className="text-2xl font-display font-black text-slate-900 mb-8">Tin tức khác</h2>
                    <FeaturedGrid />
                </div>
            </div>

            <Footer />
        </div>
    );
}
