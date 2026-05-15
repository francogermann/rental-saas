import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, getAdminJwtPayload } from '@/lib/admin-session';
import type { AdminRole } from '@/lib/admin-role';
import { adminHasPermission, type AdminPermission } from '@/lib/admin-permissions';

export type AdminSessionContext = {
    username: string;
    role: AdminRole;
};

export async function getAdminSession(): Promise<AdminSessionContext | null> {
    const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
    const payload = await getAdminJwtPayload(token);
    if (!payload) return null;
    return { username: payload.username, role: payload.role };
}

/** Sesión válida o redirect a login (server actions / RSC). */
export async function requireAdminSession(): Promise<AdminSessionContext> {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }
    return session;
}

/** Sesión + permiso; si falta permiso → tablero con aviso. */
export async function requireAdminPermission(permission: AdminPermission): Promise<AdminSessionContext> {
    const session = await requireAdminSession();
    if (!adminHasPermission(session.role, permission)) {
        redirect('/admin/dashboard?error=forbidden');
    }
    return session;
}

/** Para páginas RSC: mismo comportamiento que requireAdminPermission. */
export async function requireAdminPagePermission(permission: AdminPermission): Promise<AdminSessionContext> {
    return requireAdminPermission(permission);
}
