export default async function AdminDashboard() {
    let stats = { totalArticles: 0, pendingArticles: 0, activeFeeds: 0, visitors: 0 };
    try {
        // Use "no-store" to ensure real-time data
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/stats`, { cache: 'no-store' });
        if (res.ok) stats = await res.json();
    } catch (e) { console.error(e); }

    return (
        <div>
            <h1 className="text-2xl font-bold font-display text-slate-900 mb-6">Tổng quan hệ thống</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    label="Tổng bài viết"
                    value={stats.totalArticles.toLocaleString()}
                    change="Từ tất cả nguồn"
                    color="bg-blue-500"
                />
                <StatsCard
                    label="Tin chờ duyệt (Pending)"
                    value={stats.pendingArticles.toLocaleString()}
                    change="Cần xử lý ngay"
                    color="bg-orange-500"
                />
                <StatsCard
                    label="Nguồn tin Active"
                    value={stats.activeFeeds}
                    change="Đang hoạt động"
                    color="bg-green-500"
                />
            </div>

            {/* Quick Actions Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Hoạt động gần đây</h2>
                <p className="text-slate-500 text-sm">Chưa có dữ liệu hoạt động.</p>
            </div>
        </div>
    );
}

function StatsCard({ label, value, change, color }: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{value}</h3>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${color}`}></span>
                <span className="text-xs text-slate-400">{change}</span>
            </div>
        </div>
    )
}
