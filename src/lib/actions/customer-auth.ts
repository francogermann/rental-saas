'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { upsertCustomerForAuthUser } from '@/lib/customer-auth-sync';
import { getStorefrontOrgId } from '@/lib/storefront-org';
import type { ActionResult } from '@/types/domain';

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  phone: z.string().trim().optional(),
});

export async function registerCustomerProfile(input: {
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<ActionResult<{ customerId: string }>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues.map((i) => i.message).join(' ') };
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { data: null, error: 'Iniciá sesión para completar tu registro.', code: 'UNAUTHENTICATED' };
  }

  const admin = createAdminClient();
  const orgResult = await getStorefrontOrgId(admin);
  if ('error' in orgResult) {
    return { data: null, error: orgResult.error };
  }

  const syncResult = await upsertCustomerForAuthUser(admin, {
    orgId: orgResult.orgId,
    userId: user.id,
    email: user.email,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone || null,
  });

  if ('error' in syncResult) {
    return { data: null, error: syncResult.error };
  }

  revalidatePath('/dashboard');
  return { data: { customerId: syncResult.customerId }, error: null };
}
