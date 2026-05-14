'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createGarment(formData: FormData) {
  const supabase = createAdminClient();

  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const description = formData.get('description') as string;
  const size_label = formData.get('size_label') as string;
  const category = formData.get('category') as string;
  const rental_price = parseFloat(formData.get('rental_price') as string);
  const deposit_amount = parseFloat(formData.get('deposit_amount') as string);

  // Default to maison-demo organization for MVP
  const { data: orgData } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'maison-demo')
    .single();

  if (!orgData) return { error: 'Organización no encontrada' };

  const { error } = await supabase.from('garments').insert({
    organization_id: orgData.id,
    name,
    sku,
    description,
    size_label,
    category,
    rental_price,
    deposit_amount,
    operative_status: 'disponible',
  }).select('id').single();

  if (error) {
    console.error('Error creating garment:', error);
    return { error: 'No se pudo crear la prenda. Verifique el SKU.' };
  }

  // Redirect on success
  redirect('/admin/garments');
}

export async function updateGarment(formData: FormData) {
  const supabase = createAdminClient();

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const description = formData.get('description') as string;
  const size_label = formData.get('size_label') as string;
  const category = formData.get('category') as string;
  const operative_status = formData.get('operative_status') as string;
  const rental_price = parseFloat(formData.get('rental_price') as string);
  const deposit_amount = parseFloat(formData.get('deposit_amount') as string);

  const { error } = await supabase.from('garments')
    .update({
      name,
      sku,
      description,
      size_label,
      category,
      rental_price,
      deposit_amount,
      operative_status
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating garment:', error);
    throw new Error('No se pudieron actualizar los datos de la prenda.');
  }

  redirect('/admin/garments');
}

export async function updateReservationStatus(formData: FormData) {
  const supabase = createAdminClient();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  const { error } = await supabase.from('reservations')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar estado:', error);
    throw new Error('No se pudo actualizar el estado de la reserva.');
  }

  redirect('/admin/reservations');
}
