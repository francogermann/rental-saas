export const ADMIN_ROLES = ['administrator', 'manager', 'seller'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
    return typeof value === 'string' && (ADMIN_ROLES as readonly string[]).includes(value);
}

/** Valida `ADMIN_ROLE` u otros orígenes; tokens sin claim usan administrator (retrocompatible). */
export function parseAdminRole(value: unknown): AdminRole {
    if (isAdminRole(value)) return value;
    return 'administrator';
}

export function adminRoleLabelEs(role: AdminRole): string {
    switch (role) {
        case 'administrator':
            return 'Administrador';
        case 'manager':
            return 'Encargado';
        case 'seller':
            return 'Vendedor';
        default:
            return role;
    }
}
