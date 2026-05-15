import type { AdminRole } from '@/lib/admin-role';

export type AdminPermission =
    | 'dashboard:view'
    | 'garments:read'
    | 'garments:write'
    | 'locations:read'
    | 'reservations:read'
    | 'reservations:write'
    | 'customers:create'
    | 'customers:anonymize'
    | 'audit:read'
    | 'trash:manage';

const ALL_PERMISSIONS: AdminPermission[] = [
    'dashboard:view',
    'garments:read',
    'garments:write',
    'locations:read',
    'reservations:read',
    'reservations:write',
    'customers:create',
    'customers:anonymize',
    'audit:read',
    'trash:manage',
];

const SELLER: ReadonlySet<AdminPermission> = new Set<AdminPermission>([
    'dashboard:view',
    'garments:read',
    'locations:read',
    'reservations:read',
    'reservations:write',
    'customers:create',
]);

const MANAGER: ReadonlySet<AdminPermission> = new Set<AdminPermission>([
    ...Array.from(SELLER),
    'garments:write',
    'customers:anonymize',
    'audit:read',
    'trash:manage',
]);

const ADMINISTRATOR: ReadonlySet<AdminPermission> = new Set<AdminPermission>(ALL_PERMISSIONS);

export const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
    seller: SELLER,
    manager: MANAGER,
    administrator: ADMINISTRATOR,
};

export function adminHasPermission(role: AdminRole, permission: AdminPermission): boolean {
    return ROLE_PERMISSIONS[role].has(permission);
}
