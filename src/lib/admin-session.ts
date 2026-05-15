import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { parseAdminRole, type AdminRole } from '@/lib/admin-role';

export const ADMIN_SESSION_COOKIE = 'cd_admin';

const JWT_ROLE_CLAIM = 'role';

function readJwtSecret(): Uint8Array | null {
    const s = process.env.ADMIN_JWT_SECRET;
    if (!s || s.length < 32) return null;
    return new TextEncoder().encode(s);
}

export type AdminJwtPayload = {
    username: string;
    role: AdminRole;
};

export async function signAdminSession(username: string, role: AdminRole): Promise<string> {
    const secret = readJwtSecret();
    if (!secret) {
        throw new Error('ADMIN_JWT_SECRET debe tener al menos 32 caracteres.');
    }
    return await new SignJWT({ [JWT_ROLE_CLAIM]: role })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(username)
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
    const p = await getAdminJwtPayload(token);
    return p !== null;
}

export async function getAdminJwtPayload(token: string | undefined): Promise<AdminJwtPayload | null> {
    const secret = readJwtSecret();
    if (!secret || !token) return null;
    try {
        const { payload } = await jwtVerify(token, secret);
        const sub = payload.sub;
        if (typeof sub !== 'string' || sub.length === 0) return null;
        const rawRole = payload[JWT_ROLE_CLAIM];
        const role = parseAdminRole(typeof rawRole === 'string' ? rawRole : undefined);
        return { username: sub, role };
    } catch {
        return null;
    }
}
