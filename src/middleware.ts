import { createServerClient as createSSRClientMiddleware, type CookieOptions as CookieOptionsMiddleware } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/lib/admin-session';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request: { headers: request.headers } });

    const pathname = request.nextUrl.pathname;
    const isAdmin = pathname.startsWith('/admin');
    const isAdminLogin = pathname === '/admin/login';

    if (isAdmin && !isAdminLogin) {
        const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
        const ok = await verifyAdminToken(token);
        if (!ok) {
            const login = new URL('/admin/login', request.url);
            login.searchParams.set('next', pathname);
            return NextResponse.redirect(login);
        }
    }

    if (isAdminLogin) {
        const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
        if (await verifyAdminToken(token)) {
            const next = request.nextUrl.searchParams.get('next');
            const dest = next && next.startsWith('/admin') && next !== '/admin/login' ? next : '/admin/dashboard';
            return NextResponse.redirect(new URL(dest, request.url));
        }
    }

    const supabase = createSSRClientMiddleware(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptionsMiddleware) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptionsMiddleware) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        },
    );

    const { data: { user } } = await supabase.auth.getUser();

    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuth = request.nextUrl.pathname.startsWith('/auth');

    if (isDashboard && !user) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuth && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response; // NOTE: organization_id contextual injection logic omitted for simplicity since it is no longer required with the auth trigger approach
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/auth/callback).*)',
    ],
};
