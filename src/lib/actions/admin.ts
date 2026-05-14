'use server';

import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const GARMENT_PHOTOS_BUCKET = 'garment-photos';
const MAX_PHOTO_FILES = 12;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

async function uploadGarmentPhotoFiles(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    garmentId: string,
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
        const path = `${organizationId}/${garmentId}/${randomUUID()}.${ext}`;
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
    const supabase = createAdminClient();

    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const description = formData.get('description') as string;
    const size_label = formData.get('size_label') as string;
    const category = formData.get('category') as string;
    const rental_price = parseFloat(String(formData.get('rental_price') ?? ''));
    const deposit_amount = parseFloat(String(formData.get('deposit_amount') ?? ''));
    const photos_urls = parsePhotosUrlsField(formData.get('photos_urls') as string | null);
    const files = collectPhotoFiles(formData);

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

    const { data: inserted, error: insertError } = await supabase
        .from('garments')
        .insert({
            organization_id: orgData.id,
            name,
            sku,
            description,
            size_label,
            category,
            rental_price,
            deposit_amount,
            photos_urls,
            operative_status: 'available',
        })
        .select('id')
        .single();

    if (insertError || !inserted) {
        console.error('Error creating garment:', insertError);
        return { error: 'No se pudo crear la prenda. Verificá que el SKU sea único.' };
    }

    const garmentId = inserted.id;

    if (files.length > 0) {
        const { urls: uploaded, error: uploadError } = await uploadGarmentPhotoFiles(
            supabase,
            orgData.id,
            garmentId,
            files,
        );
        if (uploadError) {
            if (photos_urls.length === 0) {
                await supabase.from('garments').delete().eq('id', garmentId);
            }
            return { error: uploadError };
        }
        const merged = [...photos_urls, ...uploaded];
        const { error: updateError } = await supabase
            .from('garments')
            .update({ photos_urls: merged })
            .eq('id', garmentId);
        if (updateError) {
            console.error('Error updating garment photos:', updateError);
            return { error: 'La prenda se creó pero falló guardar las fotos subidas.' };
        }
    }

    revalidatePath('/admin/garments');
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
    const photos_urls_raw = formData.get('photos_urls') as string;
    const photos_urls = parsePhotosUrlsField(photos_urls_raw);

    if (!Number.isNaN(rental_price) && !Number.isNaN(deposit_amount) && deposit_amount > rental_price) {
        throw new Error('La seña no puede ser mayor que el alquiler.');
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
            photos_urls
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
    const supabase = createAdminClient();
    const id = formData.get('id') as string;
    const status = formData.get('status') as string;

    const { error } = await supabase.from('reservations')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('CRITICAL ERROR updating reservation status:', error);
        throw new Error(`No se pudo actualizar el estado: ${error.message} (${error.code})`);
    }

    revalidatePath('/admin/reservations');
    redirect('/admin/reservations');
}
