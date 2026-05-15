'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdminSession } from '@/lib/admin-auth-server';

const GARMENT_PHOTOS_BUCKET = 'garment-photos';
const MAX_PHOTO_FILES = 12;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export type AdminLocationOption = { id: string; name: string; address_line: string };

function safeReservationsRedirect(formData: FormData): string {
    const raw = String(formData.get('next') ?? '').trim();
    if (raw.startsWith('/admin/reservations') && !raw.includes('//') && !raw.includes('@')) {
        return raw;
    }
    return '/admin/reservations';
}

export async function listGarmentLocations(): Promise<AdminLocationOption[]> {
    await requireAdminSession();
    const supabase = createAdminClient();
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', 'maison-demo').single();
    if (!org) return [];
    const { data, error } = await supabase
        .from('locations')
        .select('id, name, address_line')
        .eq('organization_id', org.id)
        .order('sort_order', { ascending: true });
    if (error || !data) return [];
    return data;
}

function extForMime(mime: string): string {
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/gif') return 'gif';
    return 'bin';
}

function parsePhotosUrlsField(raw: string | null): string[] {
    if (!raw) return [];
    return raw.split('\n').map((u) => u.trim()).filter(Boolean);
}

function collectPhotoFiles(formData: FormData): File[] {
    const out: File[] = [];
    for (const item of formData.getAll('photos')) {
        if (item instanceof File && item.size > 0) out.push(item);
    }
    return out;
}

function collectSizes(formData: FormData): string[] {
    const raw = formData.getAll('sizes');
    const sizes: string[] = [];
    for (const item of raw) {
        if (typeof item === 'string' && item.trim()) sizes.push(item.trim());
    }
    return sizes;
}

/** Sufijo estable para SKU (ej. Plus Size -> Plus-Size). */
function skuSuffixForSize(size: string): string {
    return size.trim().replace(/\s+/g, '-');
}

async function uploadGarmentPhotoFiles(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    storageFolder: string,
    files: File[],
): Promise<{ urls: string[]; error?: string }> {
    const urls: string[] = [];
    for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            return { urls, error: `Tipo no permitido (${file.type}): ${file.name}` };
        }
        if (file.size > MAX_PHOTO_BYTES) {
            return { urls, error: `Archivo demasiado grande (máx 5MB): ${file.name}` };
        }
        const ext = extForMime(file.type);
        const path = `${organizationId}/${storageFolder}/${randomUUID()}.${ext}`;
        const body = Buffer.from(await file.arrayBuffer());
        const { error } = await supabase.storage.from(GARMENT_PHOTOS_BUCKET).upload(path, body, {
            contentType: file.type,
            upsert: false,
        });
        if (error) {
            console.error('Storage upload error:', error);
            return { urls, error: `No se pudo subir ${file.name}: ${error.message}` };
        }
        const { data } = supabase.storage.from(GARMENT_PHOTOS_BUCKET).getPublicUrl(path);
        urls.push(data.publicUrl);
    }
    return { urls };
}

export async function createGarment(formData: FormData) {
    await requireAdminSession();
    const supabase = createAdminClient();

    const name = (formData.get('name') as string)?.trim();
    const skuBase = (formData.get('sku') as string)?.trim();
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const rental_price = parseFloat(String(formData.get('rental_price') ?? ''));
    const deposit_amount = parseFloat(String(formData.get('deposit_amount') ?? ''));
    const photos_urls = parsePhotosUrlsField(formData.get('photos_urls') as string | null);
    const files = collectPhotoFiles(formData);
    const sizes = collectSizes(formData);
    const locationIdRaw = formData.get('location_id') as string | null;
    const location_id = locationIdRaw && locationIdRaw.length > 0 ? locationIdRaw : null;

    if (!name || !skuBase || !description || !category) {
        return { error: 'Completá nombre, SKU base, descripción y categoría.' };
    }
    if (sizes.length === 0) {
        return { error: 'Seleccioná al menos un talle disponible.' };
    }
    if (Number.isNaN(rental_price) || rental_price < 0) {
        return { error: 'Precio de alquiler inválido' };
    }
    if (Number.isNaN(deposit_amount) || deposit_amount < 0) {
        return { error: 'Garantía / seña inválida' };
    }
    if (deposit_amount > rental_price) {
        return { error: 'La seña no puede ser mayor que el alquiler (sugerimos ~⅓ del alquiler, ej. $1.500 + $500).' };
    }
    if (files.length > MAX_PHOTO_FILES) {
        return { error: `Máximo ${MAX_PHOTO_FILES} archivos de imagen` };
    }
    if (photos_urls.length === 0 && files.length === 0) {
        return { error: 'Agregá al menos una foto (archivo o URL)' };
    }

    const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'maison-demo')
        .single();

    if (!orgData) return { error: 'Organización no encontrada' };

    if (location_id) {
        const { data: locOk } = await supabase
            .from('locations')
            .select('id')
            .eq('id', location_id)
            .eq('organization_id', orgData.id)
            .maybeSingle();
        if (!locOk) {
            return { error: 'La sede seleccionada no es válida.' };
        }
    }

    const style_group_id = randomUUID();
    let mergedPhotos = [...photos_urls];

    if (files.length > 0) {
        const { urls: uploaded, error: uploadError } = await uploadGarmentPhotoFiles(
            supabase,
            orgData.id,
            style_group_id,
            files,
        );
        if (uploadError) {
            return { error: uploadError };
        }
        mergedPhotos = [...photos_urls, ...uploaded];
    }

    const rows = sizes.map((size_label) => ({
        organization_id: orgData.id,
        name,
        sku: `${skuBase}-${skuSuffixForSize(size_label)}`,
        description,
        size_label,
        category,
        rental_price,
        deposit_amount,
        photos_urls: mergedPhotos,
        operative_status: 'available' as const,
        location_id,
        style_group_id,
    }));

    const { data: insertedRows, error: insertError } = await supabase
        .from('garments')
        .insert(rows)
        .select('id');

    if (insertError || !insertedRows?.length) {
        console.error('Error creating garments:', insertError);
        return { error: 'No se pudieron crear las prendas. Verificá que los SKU sean únicos (base sin duplicar).' };
    }

    revalidatePath('/admin/garments');
    redirect('/admin/garments');
}

export async function updateGarment(formData: FormData) {
    await requireAdminSession();
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
    const photos_urls_raw = formData.get('photos_urls') as string;
    const photos_urls = parsePhotosUrlsField(photos_urls_raw);
    const locationIdRaw = formData.get('location_id') as string | null;
    const location_id = locationIdRaw && locationIdRaw.length > 0 ? locationIdRaw : null;

    if (!Number.isNaN(rental_price) && !Number.isNaN(deposit_amount) && deposit_amount > rental_price) {
        throw new Error('La seña no puede ser mayor que el alquiler.');
    }

    const { data: row } = await supabase.from('garments').select('organization_id').eq('id', id).single();
    if (location_id && row?.organization_id) {
        const { data: locOk } = await supabase
            .from('locations')
            .select('id')
            .eq('id', location_id)
            .eq('organization_id', row.organization_id)
            .maybeSingle();
        if (!locOk) {
            throw new Error('La sede seleccionada no es válida.');
        }
    }

    const { error } = await supabase.from('garments')
        .update({
            name,
            sku,
            description,
            size_label,
            category,
            rental_price,
            deposit_amount,
            operative_status,
            photos_urls,
            location_id,
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating garment:', error);
        throw new Error('No se pudieron actualizar los datos de la prenda.');
    }

    revalidatePath('/admin/garments');
    redirect('/admin/garments');
}

export async function updateReservationStatus(formData: FormData) {
    await requireAdminSession();
    const supabase = createAdminClient();
    const id = String(formData.get('id') ?? '');
    const status = String(formData.get('status') ?? '');

    if (!z.string().uuid().safeParse(id).success) {
        redirect(safeReservationsRedirect(formData));
    }

    const { error } = await supabase.from('reservations')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('CRITICAL ERROR updating reservation status:', error);
        throw new Error(`No se pudo actualizar el estado: ${error.message} (${error.code})`);
    }

    revalidatePath('/admin/reservations');
    redirect(safeReservationsRedirect(formData));
}

export async function anonymizeCustomer(formData: FormData) {
    await requireAdminSession();
    const id = String(formData.get('customer_id') ?? '');
    if (!z.string().uuid().safeParse(id).success) {
        redirect(safeReservationsRedirect(formData));
    }

    const supabase = createAdminClient();
    const anonEmail = `anon+${id}@redacted.invalid`;
    const { error } = await supabase
        .from('customers')
        .update({
            first_name: 'Cliente',
            last_name: 'Anónimo',
            email: anonEmail,
            phone: null,
            id_document: null,
            pii_anonymized_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('anonymizeCustomer:', error);
        throw new Error('No se pudo anonimizar los datos de la clienta.');
    }

    revalidatePath('/admin/reservations');
    redirect(safeReservationsRedirect(formData));
}

const manualReservationDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido');

export type ManualReservationFormState = {
    error?: string;
};

export async function createManualReservation(
    _prev: ManualReservationFormState,
    formData: FormData,
): Promise<ManualReservationFormState> {
    await requireAdminSession();
    const supabase = createAdminClient();

    const eventRaw = String(formData.get('event_date') ?? '').trim();
    const parsed = z
        .object({
            garment_id: z.string().min(1, 'Elegí una prenda de la lista.').uuid('Elegí una prenda de la lista.'),
            pickup_date: manualReservationDateSchema,
            return_date: manualReservationDateSchema,
            event_date: z.union([manualReservationDateSchema, z.literal('')]),
            rental_price: z.coerce.number().positive(),
            deposit_amount: z.coerce.number().min(0),
        })
        .refine((d) => d.pickup_date <= d.return_date, { message: 'La devolución no puede ser anterior al retiro.' })
        .safeParse({
            garment_id: String(formData.get('garment_id') ?? ''),
            pickup_date: String(formData.get('pickup_date') ?? ''),
            return_date: String(formData.get('return_date') ?? ''),
            event_date: eventRaw,
            rental_price: formData.get('rental_price'),
            deposit_amount: formData.get('deposit_amount'),
        });

    if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join(' ');
        return { error: msg || 'Datos inválidos.' };
    }

    const { garment_id, pickup_date, return_date, rental_price, deposit_amount } = parsed.data;
    const event_date =
        parsed.data.event_date && parsed.data.event_date.length >= 10 ? parsed.data.event_date : pickup_date;

    if (deposit_amount > rental_price) {
        return { error: 'La seña no puede ser mayor que el alquiler.' };
    }

    const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'maison-demo')
        .single();

    if (orgErr || !org) {
        return { error: 'Organización no encontrada.' };
    }

    const customerMode = String(formData.get('customer_mode') ?? 'registered').trim() === 'walk_in' ? 'walk_in' : 'registered';
    let customer_id: string;

    if (customerMode === 'walk_in') {
        const fullName = String(formData.get('walk_in_full_name') ?? '').trim();
        if (fullName.length < 2) {
            return { error: 'Ingresá el nombre de la clienta (al menos 2 caracteres).' };
        }
        const parts = fullName.split(/\s+/).filter(Boolean);
        const first_name = parts[0] ?? fullName;
        const last_name = parts.length > 1 ? parts.slice(1).join(' ') : '—';

        const phoneRaw = String(formData.get('walk_in_phone') ?? '').trim();
        const phone = phoneRaw.length > 0 ? phoneRaw : null;

        const emailRaw = String(formData.get('walk_in_email') ?? '').trim();
        const emailParsed = z.string().email().safeParse(emailRaw);
        const email =
            emailRaw.length > 0 && emailParsed.success
                ? emailParsed.data
                : `walkin+${randomUUID()}@walkin.invalid`;

        const { data: inserted, error: insErr } = await supabase
            .from('customers')
            .insert({
                organization_id: org.id,
                first_name,
                last_name,
                email,
                phone,
                notes: 'Alta rápida desde reserva manual (mostrador).',
            })
            .select('id')
            .single();

        if (insErr || !inserted) {
            console.error('createManualReservation walk-in customer:', insErr);
            if (insErr?.code === '23505') {
                return {
                    error:
                        'Ese email ya está registrado. Usá otro email, buscá la clienta en la lista o dejá el email vacío para generar uno interno.',
                };
            }
            return { error: insErr?.message || 'No se pudo registrar a la clienta.' };
        }
        customer_id = inserted.id;
    } else {
        const cid = String(formData.get('customer_id') ?? '').trim();
        if (!z.string().uuid().safeParse(cid).success) {
            return { error: 'Elegí una clienta de la lista o usá “Alta rápida (mostrador)”.' };
        }
        const { data: custOk, error: custErr } = await supabase
            .from('customers')
            .select('id')
            .eq('id', cid)
            .eq('organization_id', org.id)
            .maybeSingle();
        if (custErr || !custOk) {
            return { error: 'La clienta seleccionada no es válida.' };
        }
        customer_id = custOk.id;
    }

    const pickupLocRaw = String(formData.get('pickup_location_id') ?? '').trim();
    let pickup_location_id: string | null = null;
    if (pickupLocRaw.length > 0) {
        if (!z.string().uuid().safeParse(pickupLocRaw).success) {
            return { error: 'Sede de retiro inválida.' };
        }
        const { data: locOk, error: locErr } = await supabase
            .from('locations')
            .select('id')
            .eq('id', pickupLocRaw)
            .eq('organization_id', org.id)
            .maybeSingle();
        if (locErr || !locOk) {
            return { error: 'La sede de retiro no es válida para esta organización.' };
        }
        pickup_location_id = pickupLocRaw;
    }

    const reservationNotes = String(formData.get('reservation_notes') ?? '').trim();
    const p_notes = reservationNotes.length > 0 ? reservationNotes : null;

    const { error: rpcError } = await supabase.rpc('create_reservation_with_block_for_org', {
        p_organization_id: org.id,
        p_garment_id: garment_id,
        p_customer_id: customer_id,
        p_pickup_date: pickup_date,
        p_return_date: return_date,
        p_event_date: event_date,
        p_rental_price: rental_price,
        p_deposit_amount: deposit_amount,
        p_pickup_location_id: pickup_location_id ?? undefined,
        p_notes: p_notes ?? undefined,
        p_status: 'confirmed',
    });

    if (rpcError) {
        console.error('createManualReservation RPC:', rpcError);
        return { error: rpcError.message || 'No se pudo crear la reserva.' };
    }

    revalidatePath('/admin/reservations');
    revalidatePath('/admin/reservations/new');
    revalidatePath('/admin/dashboard');
    redirect('/admin/reservations?view=active&page=1');
}
