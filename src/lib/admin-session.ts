import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';

export const ADMIN_SESSION_COOKIE = 'cd_admin';

function readJwtSecret(): Uint8Array | null {
    const s = process.env.ADMIN_JWT_SECRET;
    if (!s || s.length < 32) return null;
    return new TextEncoder().encode(s);
}

export async function signAdminSession(username: string): Promise<string> {
    const secret = readJwtSecret();
    if (!secret) {
        throw new Error('ADMIN_JWT_SECRET debe tener al menos 32 caracteres.');
    }
    return await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(username)
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
    const secret = readJwtSecret();
    if (!secret || !token) return false;
    try {
        const { payload } = await jwtVerify(token, secret);
        return typeof payload.sub === 'string' && payload.sub.length > 0;
    } catch {
        return false;
    }
}
