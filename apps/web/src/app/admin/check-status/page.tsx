"use client";

import { useState } from "react";

export default function CheckArticlesStatusPage() {
    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState<any[]>([]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3001/articles?status=all");
            const data = await res.json();
            setArticles(data);
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-4">Check Article Status</h1>

            <button
                onClick={checkStatus}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-bold mb-6"
            >
                {loading ? "Loading..." : "Check All Articles Status"}
            </button>

            {articles.length > 0 && (
                <div className="space-y-2">
                    <p className="font-bold">Total: {articles.length} articles</p>
                    {articles.map((a) => (
                        <div key={a.id} className="p-3 bg-slate-100 rounded">
                            <p className="font-bold">ID: {a.id} - {a.title.substring(0, 50)}...</p>
                            <p className="text-sm">Status: <span className="font-mono bg-yellow-200 px-2">{a.status || 'NULL'}</span></p>
                            <p className="text-sm">Slug: {a.slug}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
