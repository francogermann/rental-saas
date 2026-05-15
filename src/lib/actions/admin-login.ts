'use server';

import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, signAdminSession } from '@/lib/admin-session';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function passwordMatches(input: string, expected: string | undefined): boolean {
    if (!expected || input.length === 0) return false;
    const a = createHash('sha256').update(input, 'utf8').digest();
    const b = createHash('sha256').update(expected, 'utf8').digest();
    return timingSafeEqual(a, b);
}

function sessionCookieOptions() {
    const secure = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true as const,
        secure,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: COOKIE_MAX_AGE,
    };
}

export async function loginAdmin(formData: FormData) {
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const expectedUser = process.env.ADMIN_USERNAME?.trim();
    const expectedPass = process.env.ADMIN_PASSWORD;
    const jwtOk = process.env.ADMIN_JWT_SECRET && process.env.ADMIN_JWT_SECRET.length >= 32;

    if (!expectedUser || !expectedPass || !jwtOk) {
        redirect('/admin/login?error=config');
    }

    if (username !== expectedUser || !passwordMatches(password, expectedPass)) {
        redirect('/admin/login?error=cred');
    }

    let token: string;
    try {
        token = await signAdminSession(username);
    } catch {
        redirect('/admin/login?error=config');
    }

    cookies().set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());

    const nextRaw = String(formData.get('next') ?? '').trim();
    const next =
        nextRaw.startsWith('/admin') && nextRaw !== '/admin/login' && !nextRaw.startsWith('/admin/login?')
            ? nextRaw
            : '/admin/dashboard';
    redirect(next);
}

export async function logoutAdmin() {
    cookies().set(ADMIN_SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
    redirect('/admin/login');
}
