'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { dateRangesOverlap } from '@/lib/date-range';
import type { ActionResult } from '@/types/domain';

const joinSchema = z.object({
  garmentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((d) => d.pickupDate <= d.returnDate, { message: 'Fechas inválidas', path: ['returnDate'] });

export async function joinGarmentWaitlist(input: {
  garmentId: string;
  organizationId: string;
  pickupDate: string;
  returnDate: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues.map((i) => i.message).join('. ') };
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Iniciá sesión para anotarte en la lista de espera.', code: 'UNAUTHENTICATED' };
  }

  const admin = createAdminClient();
  const { data: blocks } = await admin
    .from('garment_blocks')
    .select('date_from, date_to')
    .eq('garment_id', parsed.data.garmentId)
    .is('released_at', null);

  const overlaps = blocks?.some((b) =>
    dateRangesOverlap(parsed.data.pickupDate, parsed.data.returnDate, b.date_from, b.date_to),
  );
  if (!overlaps) {
    return { data: null, error: 'Para esas fechas la prenda ya está disponible. No hace falta lista de espera.' };
  }

  const { data, error } = await supabase
    .from('garment_waitlist')
    .insert({
      user_id: user.id,
      organization_id: parsed.data.organizationId,
      garment_id: parsed.data.garmentId,
      pickup_date: parsed.data.pickupDate,
      return_date: parsed.data.returnDate,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Ya estás anotada para ese rango de fechas.' };
    }
    return { data: null, error: 'No se pudo registrar la lista de espera.' };
  }

  revalidatePath(`/catalog/${parsed.data.garmentId}`);
  return { data: { id: data.id }, error: null };
}
