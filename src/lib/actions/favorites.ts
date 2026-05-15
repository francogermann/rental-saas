'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/domain';

export async function toggleFavoriteGarment(garmentId: string): Promise<ActionResult<{ favorited: boolean }>> {
  if (!z.string().uuid().safeParse(garmentId).success) {
    return { data: null, error: 'Prenda inválida.' };
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Iniciá sesión para guardar favoritos.', code: 'UNAUTHENTICATED' };
  }

  const { data: existing } = await supabase
    .from('favorite_garments')
    .select('garment_id')
    .eq('user_id', user.id)
    .eq('garment_id', garmentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('favorite_garments').delete().eq('user_id', user.id).eq('garment_id', garmentId);
    if (error) {
      return { data: null, error: 'No se pudo quitar de favoritos.' };
    }
    revalidatePath('/catalog');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/favorites');
    return { data: { favorited: false }, error: null };
  }

  const { error } = await supabase.from('favorite_garments').insert({ user_id: user.id, garment_id: garmentId });
  if (error) {
    return { data: null, error: 'No se pudo agregar a favoritos.' };
  }
  revalidatePath('/catalog');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/favorites');
  return { data: { favorited: true }, error: null };
}
