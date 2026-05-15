import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const STOREFRONT_ORG_SLUG = 'maison-demo';

export async function getStorefrontOrgId(
  admin: SupabaseClient<Database>,
): Promise<{ orgId: string } | { error: string }> {
  const { data, error } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', STOREFRONT_ORG_SLUG)
    .single();

  if (error || !data) {
    return { error: 'Organización no encontrada.' };
  }
  return { orgId: data.id };
}
