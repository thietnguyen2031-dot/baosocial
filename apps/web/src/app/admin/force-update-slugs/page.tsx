"use client";

import { useState } from "react";

export default function ForceUpdateSlugsPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpdate = async () => {
        if (!confirm("Bạn có chắc muốn regenerate TẤT CẢ slugs?")) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("http://localhost:3001/force-update-slugs", {
                method: "POST"
            });
            const data = await res.json();
            setResult(data);
        } catch (e: any) {
            setResult({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-4">Force Update All Slugs</h1>
            <p className="mb-6 text-slate-600">
                Click button này để regenerate lại slug cho TẤT CẢ bài viết trong database.
            </p>

            <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-bold"
            >
                {loading ? "Đang update..." : "🔄 Force Update All Slugs"}
            </button>

            {result && (
                <div className="mt-6 p-4 bg-slate-100 rounded-lg">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
