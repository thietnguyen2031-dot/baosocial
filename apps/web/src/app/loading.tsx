export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar Skeleton */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-32 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div className="hidden md:flex gap-6 ml-8">
                            <div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div>
                            <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
                            <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                        <div className="w-24 h-8 bg-slate-200 rounded-lg animate-pulse hidden md:block"></div>
                    </div>
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="max-w-[1280px] mx-auto px-4 lg:px-6 mt-6 lg:mt-8 space-y-12">

                {/* Top News Section Skeleton */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-slate-300 rounded-full animate-pulse"></div>
                        <div className="w-32 h-6 bg-slate-200 rounded animate-pulse"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:h-[500px]">
                        {/* Highlight Article */}
                        <div className="md:col-span-8 bg-slate-200 rounded-2xl animate-pulse h-64 md:h-auto"></div>
                        {/* Sidebar Articles */}
                        <div className="md:col-span-4 flex flex-col gap-4">
                            <div className="flex-1 bg-slate-200 rounded-2xl animate-pulse h-48 md:h-auto"></div>
                            <div className="flex-1 bg-slate-200 rounded-2xl animate-pulse h-48 md:h-auto"></div>
                        </div>
                    </div>
                </section>

                {/* Category Sections Skeletons */}
                {[1, 2].map((i) => (
                    <section key={i}>
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="flex flex-col gap-3">
                                    <div className="w-full aspect-[4/3] bg-slate-200 rounded-2xl animate-pulse"></div>
                                    <div className="w-3/4 h-5 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="w-full h-4 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="w-5/6 h-4 bg-slate-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

            </main>
        </div>
    );
}
