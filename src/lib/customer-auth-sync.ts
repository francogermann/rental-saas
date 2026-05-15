import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export type UpsertCustomerForAuthInput = {
  orgId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

export type UpsertCustomerForAuthResult =
  | { customerId: string }
  | { error: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function upsertCustomerForAuthUser(
  admin: SupabaseClient<Database>,
  input: UpsertCustomerForAuthInput,
): Promise<UpsertCustomerForAuthResult> {
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() ? input.phone.trim() : null;

  const { data: existing, error: fetchError } = await admin
    .from('customers')
    .select('id, auth_user_id, first_name, last_name, phone')
    .eq('organization_id', input.orgId)
    .ilike('email', email)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('upsertCustomerForAuthUser fetch:', fetchError);
    return { error: 'No se pudo verificar tu ficha de clienta.' };
  }

  if (existing) {
    if (existing.auth_user_id && existing.auth_user_id !== input.userId) {
      return { error: 'Este email ya está asociado a otra cuenta.' };
    }

    if (existing.auth_user_id === input.userId) {
      return { customerId: existing.id };
    }

    const { error: updateError } = await admin
      .from('customers')
      .update({
        auth_user_id: input.userId,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: phone ?? existing.phone,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('upsertCustomerForAuthUser link:', updateError);
      return { error: 'No se pudo vincular tu cuenta con tu ficha de clienta.' };
    }

    return { customerId: existing.id };
  }

  const { data: inserted, error: insertError } = await admin
    .from('customers')
    .insert({
      organization_id: input.orgId,
      auth_user_id: input.userId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email,
      phone,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('upsertCustomerForAuthUser insert:', insertError);
    if (insertError?.code === '23505') {
      return { error: 'Este email ya está registrado. Iniciá sesión o usá otro email.' };
    }
    return { error: 'No se pudo crear tu ficha de clienta.' };
  }

  return { customerId: inserted.id };
}

/** Vincula auth_user_id en checkout si la clienta está logueada con el mismo email. */
export async function linkAuthUserToCustomerAtCheckout(
  admin: SupabaseClient<Database>,
  params: {
    customerId: string;
    customerEmail: string;
    authUserId: string;
    authEmail: string;
    existingAuthUserId: string | null;
  },
): Promise<void> {
  if (normalizeEmail(params.customerEmail) !== normalizeEmail(params.authEmail)) {
    return;
  }
  if (params.existingAuthUserId === params.authUserId) {
    return;
  }
  if (params.existingAuthUserId && params.existingAuthUserId !== params.authUserId) {
    console.warn('checkout: customer email already linked to a different auth user');
    return;
  }

  const { error } = await admin
    .from('customers')
    .update({ auth_user_id: params.authUserId })
    .eq('id', params.customerId);

  if (error) {
    console.warn('checkout: failed to link auth_user_id', error);
  }
}
