import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { linkAuthUserToCustomerAtCheckout } from '@/lib/customer-auth-sync';

export async function findOrCreateCheckoutCustomer(
  admin: SupabaseClient<Database>,
  authClient: SupabaseClient<Database> | null,
  params: {
    orgId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  },
): Promise<{ customerId: string } | { error: string }> {
  const email = params.email.trim().toLowerCase();

  const { data: existCustomer } = await admin
    .from('customers')
    .select('id, auth_user_id')
    .ilike('email', email)
    .eq('organization_id', params.orgId)
    .is('deleted_at', null)
    .maybeSingle();

  let customerId: string;
  let existingAuthUserId: string | null = null;

  if (existCustomer) {
    customerId = existCustomer.id;
    existingAuthUserId = existCustomer.auth_user_id;
  } else {
    const { data: newCustomer, error: createError } = await admin
      .from('customers')
      .insert({
        organization_id: params.orgId,
        first_name: params.firstName.trim(),
        last_name: params.lastName.trim(),
        email,
        phone: params.phone?.trim() || null,
      })
      .select('id, auth_user_id')
      .single();

    if (createError || !newCustomer) {
      console.error('findOrCreateCheckoutCustomer insert:', createError);
      return { error: 'Error agregando el cliente' };
    }
    customerId = newCustomer.id;
    existingAuthUserId = newCustomer.auth_user_id;
  }

  if (authClient) {
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (user?.email) {
      await linkAuthUserToCustomerAtCheckout(admin, {
        customerId,
        customerEmail: email,
        authUserId: user.id,
        authEmail: user.email,
        existingAuthUserId,
      });
    }
  }

  return { customerId };
}
