import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const url = request.nextUrl.clone();

    const isPublicRoute = url.pathname === '/';

    if (!refreshToken && !isPublicRoute) {
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    if (refreshToken && isPublicRoute) {
        // We cannot reliably parse JWT role on Edge without standard libraries (or edge-friendly ones), 
        // so we'll just redirect to a routing page, or we ignore it and let client-side router handle redirection on login page.
        // For simplicity, we'll let the login page redirect the user when it loads.
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
