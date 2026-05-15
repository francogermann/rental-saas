// =============================================================================
// lib/actions/availability.ts
// Server Actions para disponibilidad y reservas.
// 'use server' = solo se ejecutan en el servidor; nunca se expone en el bundle.
// =============================================================================
'use server';

import { z } from 'zod';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { uniquePhotoUrls } from '@/lib/photo-urls';
import type {
    ActionResult,
    AvailabilitySearchParams,
    CatalogListParams,
    GarmentSummary,
    BlockedDateRange,
    CreateReservationParams,
    CreateReservationResult,
} from '@/types/domain';

// Formato de fecha que acepta la DB: YYYY-MM-DD
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)');

// -----------------------------------------------------------------------------
// Esquemas de validación (Zod)
// -----------------------------------------------------------------------------
const AvailabilitySearchSchema = z.object({
    pickupDate: dateSchema,
    returnDate: dateSchema,
    pickupLocationId: z.string().uuid('Elegí una sede de retiro válida.'),
    sizeLabel: z.string().min(1).max(10).optional(),
    chestCm: z.number().int().min(60).max(160).optional(),
    waistCm: z.number().int().min(40).max(140).optional(),
    category: z.string().min(1).max(100).optional(),
    maxPrice: z.number().positive().optional(),
    limit: z.number().int().min(1).max(100).default(48),
    offset: z.number().int().min(0).default(0),
}).refine(
    (data) => data.pickupDate <= data.returnDate,
    { message: 'La fecha de retiro debe ser anterior o igual a la de devolución', path: ['returnDate'] },
).refine(
    (data) => data.pickupDate >= new Date().toISOString().split('T')[0],
    { message: 'La fecha de retiro no puede ser en el pasado', path: ['pickupDate'] },
);

const BlockedDatesSchema = z.object({
    garmentId: z.string().uuid('garmentId debe ser un UUID válido'),
    fromDate: dateSchema.optional(),
    untilDate: dateSchema.optional(),
});

const CatalogListSchema = z.object({
    pickupLocationId: z.string().uuid('Elegí una sede de retiro válida.'),
    sizeLabel: z.string().min(1).max(10).optional(),
    category: z.string().min(1).max(100).optional(),
    maxPrice: z.number().positive().optional(),
    limit: z.number().int().min(1).max(100).default(48),
    offset: z.number().int().min(0).default(0),
});

const CreateReservationSchema = z.object({
    garmentId: z.string().uuid(),
    customerId: z.string().uuid(),
    pickupDate: dateSchema,
    returnDate: dateSchema,
    eventDate: dateSchema.optional(),
    rentalPrice: z.number().positive(),
    depositAmount: z.number().min(0),
    pickupLocationId: z.string().uuid(),
}).refine(
    (data) => data.pickupDate <= data.returnDate,
    { message: 'Rango de fechas inválido', path: ['returnDate'] },
);


// -----------------------------------------------------------------------------
// ACTION 1: searchAvailableGarments
// Busca prendas disponibles para un rango de fechas.
// Llama a la RPC get_available_garments que usa el índice GIST internamente.
// -----------------------------------------------------------------------------
export async function searchAvailableGarments(
    params: AvailabilitySearchParams,
): Promise<ActionResult<GarmentSummary[]>> {

    const parsed = AvailabilitySearchSchema.safeParse(params);
    if (!parsed.success) {
        return {
            data: null,
            error: parsed.error.issues.map((i) => i.message).join('. '),
        };
    }

    const { pickupDate, returnDate, pickupLocationId, sizeLabel, chestCm, waistCm, category, maxPrice, limit, offset } = parsed.data;

    const supabase = createServerClient();
    const adminSupabase = createAdminClient();

    const { data: orgData, error: orgError } = await adminSupabase
        .from('organizations')
        .select('id')
        .eq('slug', 'maison-demo')
        .single();

    if (orgError || !orgData) {
        return { data: null, error: 'Tienda inactiva o no encontrada.' };
    }

    const { data: locOk } = await adminSupabase
        .from('locations')
        .select('id')
        .eq('id', pickupLocationId)
        .eq('organization_id', orgData.id)
        .maybeSingle();

    if (!locOk) {
        return { data: null, error: 'La sede de retiro no es válida para esta tienda.' };
    }

    const { data, error } = await supabase.rpc('get_available_garments', {
        p_pickup_date: pickupDate,
        p_return_date: returnDate,
        p_size_label: sizeLabel ?? undefined,
        p_chest_cm: chestCm ?? undefined,
        p_waist_cm: waistCm ?? undefined,
        p_category: category ?? undefined,
        p_max_price: maxPrice ?? undefined,
        p_limit: limit,
        p_offset: offset,
        p_organization_id: orgData.id,
        p_pickup_location_id: pickupLocationId,
    });

    if (error) {
        console.error('[searchAvailableGarments] RPC error:', error.message);
        return { data: null, error: 'Error al consultar disponibilidad. Intente nuevamente.' };
    }

    return { data: data as GarmentSummary[], error: null };
}


type CatalogGarmentRow = {
    id: string;
    name: string;
    sku: string;
    size_label: string | null;
    category: string | null;
    rental_price: number | null;
    deposit_amount: number;
    photos_urls: string[] | null;
    chest_cm: number | null;
    waist_cm: number | null;
    hip_cm: number | null;
    length_cm: number | null;
    tags: string[] | null;
    style_group_id: string | null;
    location_id: string | null;
    locations: { name: string } | null;
};

function mapCatalogRow(r: CatalogGarmentRow): GarmentSummary {
    return {
        id: r.id,
        name: r.name,
        sku: r.sku,
        size_label: r.size_label,
        category: r.category,
        rental_price: r.rental_price,
        deposit_amount: r.deposit_amount,
        photos_urls: uniquePhotoUrls(r.photos_urls ?? []),
        chest_cm: r.chest_cm,
        waist_cm: r.waist_cm,
        hip_cm: r.hip_cm,
        length_cm: r.length_cm,
        tags: r.tags ?? [],
        style_group_id: r.style_group_id,
        location_id: r.location_id,
        location_name: r.locations?.name ?? null,
    };
}

// -----------------------------------------------------------------------------
// ACTION 1b: listCatalogGarments
// Catálogo completo (publicables) sin excluir por garment_blocks.
// -----------------------------------------------------------------------------
export async function listCatalogGarments(
    params: CatalogListParams,
): Promise<ActionResult<GarmentSummary[]>> {
    const parsed = CatalogListSchema.safeParse(params);
    if (!parsed.success) {
        return {
            data: null,
            error: parsed.error.issues.map((i) => i.message).join('. '),
        };
    }

    const { pickupLocationId, sizeLabel, category, maxPrice, limit, offset } = parsed.data;
    const admin = createAdminClient();

    const { data: orgData, error: orgError } = await admin
        .from('organizations')
        .select('id')
        .eq('slug', 'maison-demo')
        .single();

    if (orgError || !orgData) {
        return { data: null, error: 'Tienda inactiva o no encontrada.' };
    }

    const { data: locOk } = await admin
        .from('locations')
        .select('id')
        .eq('id', pickupLocationId)
        .eq('organization_id', orgData.id)
        .maybeSingle();

    if (!locOk) {
        return { data: null, error: 'La sede de retiro no es válida para esta tienda.' };
    }

    let query = admin
        .from('garments')
        .select(
            `
      id, name, sku, size_label, category, rental_price, deposit_amount, photos_urls,
      chest_cm, waist_cm, hip_cm, length_cm, tags, style_group_id, location_id,
      locations!garments_location_id_fkey ( name )
    `,
        )
        .eq('organization_id', orgData.id)
        .is('deleted_at', null)
        .eq('operative_status', 'available')
        .or(`location_id.eq.${pickupLocationId},location_id.is.null`);

    if (sizeLabel) query = query.eq('size_label', sizeLabel);
    if (category) query = query.eq('category', category);
    if (maxPrice != null) query = query.lte('rental_price', maxPrice);

    const { data, error } = await query
        .order('rental_price', { ascending: true })
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('[listCatalogGarments] query error:', error.message);
        return { data: null, error: 'Error al cargar el catálogo. Intente nuevamente.' };
    }

    const rows = (data ?? []) as unknown as CatalogGarmentRow[];
    return { data: rows.map(mapCatalogRow), error: null };
}


// -----------------------------------------------------------------------------
// ACTION 2: getBlockedDatesForGarment
// Devuelve los rangos bloqueados de una prenda para que el calendario
// pueda deshabilitar esas fechas en la UI.
// Se llama cuando el usuario selecciona una prenda específica.
// -----------------------------------------------------------------------------
export async function getBlockedDatesForGarment(
    garmentId: string,
    options?: { fromDate?: string; untilDate?: string },
): Promise<ActionResult<BlockedDateRange[]>> {

    const parsed = BlockedDatesSchema.safeParse({
        garmentId,
        fromDate: options?.fromDate,
        untilDate: options?.untilDate,
    });
    if (!parsed.success) {
        return { data: null, error: 'Parámetros inválidos' };
    }

    const supabase = createServerClient();
    const adminSupabase = createAdminClient();

    const { data: orgData, error: orgError } = await adminSupabase
        .from('organizations')
        .select('id')
        .eq('slug', 'maison-demo')
        .single();

    if (orgError || !orgData) {
        return { data: null, error: 'Tienda inactiva o no encontrada.' };
    }

    const { data, error } = await supabase.rpc('get_blocked_dates_for_garment', {
        p_garment_id: parsed.data.garmentId,
        p_from_date: parsed.data.fromDate ?? undefined,
        p_until_date: parsed.data.untilDate ?? undefined,
        p_organization_id: orgData.id,
    });

    if (error) {
        console.error('[getBlockedDatesForGarment] RPC error:', error.message);
        return { data: null, error: 'No se pudo cargar el calendario de disponibilidad.' };
    }

    return { data: data as BlockedDateRange[], error: null };
}


// -----------------------------------------------------------------------------
// ACTION 3: createReservation
// Crea la reserva y el bloqueo en una sola transacción atómica (RPC).
// Devuelve errores de negocio específicos para que la UI los muestre al usuario.
// -----------------------------------------------------------------------------
export async function createReservation(
    params: CreateReservationParams,
): Promise<ActionResult<CreateReservationResult>> {

    const parsed = CreateReservationSchema.safeParse(params);
    if (!parsed.success) {
        return {
            data: null,
            error: parsed.error.issues.map((i) => i.message).join('. '),
        };
    }

    const { garmentId, customerId, pickupDate, returnDate, eventDate, rentalPrice, depositAmount, pickupLocationId } =
        parsed.data;

    const admin = createAdminClient();

    const { data: garment, error: gErr } = await admin
        .from('garments')
        .select('organization_id, location_id')
        .eq('id', garmentId)
        .is('deleted_at', null)
        .single();

    if (gErr || !garment) {
        return { data: null, error: 'Prenda no encontrada.' };
    }

    if (garment.location_id && garment.location_id !== pickupLocationId) {
        return {
            data: null,
            error: 'La sede de retiro no coincide con la ubicación del vestido. Volvé al catálogo y elegí la sede correcta.',
            code: 'PICKUP_MISMATCH',
        };
    }

    const { data: locOk } = await admin
        .from('locations')
        .select('id')
        .eq('id', pickupLocationId)
        .eq('organization_id', garment.organization_id)
        .maybeSingle();

    if (!locOk) {
        return { data: null, error: 'Sede de retiro inválida.' };
    }

    const { data, error } = await admin.rpc('create_reservation_with_block_for_org', {
        p_organization_id: garment.organization_id,
        p_garment_id: garmentId,
        p_customer_id: customerId,
        p_pickup_date: pickupDate,
        p_return_date: returnDate,
        p_event_date: (eventDate ?? pickupDate) as string,
        p_rental_price: rentalPrice,
        p_deposit_amount: depositAmount,
        p_pickup_location_id: pickupLocationId,
        p_notes: undefined,
        p_status: 'pending',
    });

    if (error) {
        // Mapear errores de la RPC a mensajes amigables para el usuario
        const msg = error.message ?? '';

        if (msg.includes('CONFLICT')) {
            return {
                data: null,
                error: 'Esta prenda ya fue reservada para esas fechas. Por favor elige otras fechas o una prenda diferente.',
                code: 'P0004',
            };
        }
        if (msg.includes('BLOCKED_CUSTOMER')) {
            return {
                data: null,
                error: 'Tu cuenta tiene una restricción activa. Por favor contacta al local.',
                code: 'P0003',
            };
        }
        if (msg.includes('UNAUTHENTICATED')) {
            return { data: null, error: 'Sesión expirada. Por favor ingresá nuevamente.', code: 'P0001' };
        }

        console.error('[createReservation] RPC error:', error.message);
        return { data: null, error: 'No se pudo crear la reserva. Intente nuevamente.' };
    }

    return { data: data as unknown as CreateReservationResult, error: null };
}


// -----------------------------------------------------------------------------
// ACTION 4: releaseBlock
// Libera un bloqueo manualmente (cancelación, fitting expirado, etc.)
// Solo puede ser llamada por usuarios del staff del org.
// -----------------------------------------------------------------------------
export async function releaseBlock(
    blockId: string,
    reason: string,
): Promise<ActionResult<{ released: true }>> {

    if (!z.string().uuid().safeParse(blockId).success) {
        return { data: null, error: 'blockId inválido' };
    }

    const supabase = createServerClient();

    const { error } = await supabase
        .from('garment_blocks')
        .update({
            released_at: new Date().toISOString(),
            release_reason: reason,
        })
        .eq('id', blockId)
        .is('released_at', null); // Idempotente: no hacer nada si ya está liberado

    if (error) {
        console.error('[releaseBlock] error:', error.message);
        return { data: null, error: 'No se pudo liberar el bloqueo.' };
    }

    return { data: { released: true }, error: null };
}