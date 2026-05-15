import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/admin-auth-server';
import { adminHasPermission } from '@/lib/admin-permissions';
import { adminRoleLabelEs } from '@/lib/admin-role';

export const dynamic = 'force-dynamic';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const role = session.role;
  const permissions = {
    dash: adminHasPermission(role, 'dashboard:view'),
    garments: adminHasPermission(role, 'garments:read'),
    resv: adminHasPermission(role, 'reservations:read'),
    resvWrite: adminHasPermission(role, 'reservations:write'),
    audit: adminHasPermission(role, 'audit:read'),
    trash: adminHasPermission(role, 'trash:manage'),
  };

  return (
    <AdminShell roleLabel={adminRoleLabelEs(role)} permissions={permissions}>
      {children}
    </AdminShell>
  );
}
