import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect /news/:id to /tin/:slug
    if (pathname.startsWith('/news/')) {
        const id = pathname.split('/')[2];

        // Fetch article by ID to get slug
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/articles/${id}`);
            if (res.ok) {
                const article = await res.json();
                if (article && article.slug) {
                    // 301 Permanent Redirect
                    return NextResponse.redirect(
                        new URL(`/tin/${article.slug}`, request.url),
                        { status: 301 }
                    );
                }
            }
        } catch (e) {
            console.error('Redirect middleware error:', e);
        }

        // If article not found or error, return 404
        return NextResponse.rewrite(new URL('/404', request.url));
    }

    return NextResponse.next();
}

// Configure which routes should trigger the middleware
export const config = {
    matcher: '/news/:path*',
};
