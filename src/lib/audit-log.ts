import { createAdminClient } from '@/lib/supabase/server';
import type { AdminSessionContext } from '@/lib/admin-auth-server';
import type { Json } from '@/types/supabase';

export type AuditLogInsert = {
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Json | Record<string, unknown> | null;
};

export async function insertAuditLog(session: AdminSessionContext, row: AuditLogInsert): Promise<void> {
    const supabase = createAdminClient();
    const meta: Json = (row.metadata ?? {}) as Json;
    const { error } = await supabase.from('audit_logs').insert({
        actor_username: session.username,
        actor_role: session.role,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id ?? null,
        metadata: meta,
    });
    if (error) {
        console.error('insertAuditLog:', error);
    }
}
