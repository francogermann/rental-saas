import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/lib/admin-session';

/** Usar al inicio de cada server action del panel admin. */
export async function requireAdminSession(): Promise<void> {
    const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
    if (!(await verifyAdminToken(token))) {
        redirect('/admin/login');
    }
}
