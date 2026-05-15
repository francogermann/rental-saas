// =============================================================================
// types/domain.ts
// Tipos del dominio de negocio. Independientes de Supabase para portabilidad.
// =============================================================================

// -----------------------------------------------------------------------------
// Enums del dominio
// -----------------------------------------------------------------------------
export const GARMENT_STATUS = {
    AVAILABLE: 'available',
    PROCESSING: 'processing',
    IN_CLEANING: 'in_cleaning',
    IN_REPAIR: 'in_repair',
    RESERVED: 'reserved',
    RETIRED: 'retired',
} as const;
export type GarmentStatus = typeof GARMENT_STATUS[keyof typeof GARMENT_STATUS];

export const BLOCK_TYPE = {
    RESERVATION: 'reservation',
    FITTING: 'fitting',
    CLEANING: 'cleaning',
    REPAIR: 'repair',
    HOLD: 'hold',
    MANUAL: 'manual',
} as const;
export type BlockType = typeof BLOCK_TYPE[keyof typeof BLOCK_TYPE];

export const RESERVATION_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PAID: 'paid',
    DELIVERED: 'delivered',
    RETURNED: 'returned',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed',
} as const;
export type ReservationStatus = typeof RESERVATION_STATUS[keyof typeof RESERVATION_STATUS];

export const CONTINGENCY_STATUS = {
    NONE: 'none',
    MINOR_DELAY: 'minor_delay',
    MAJOR_DELAY: 'major_delay',
    DAMAGED: 'damaged',
    LOST: 'lost',
} as const;
export type ContingencyStatus = typeof CONTINGENCY_STATUS[keyof typeof CONTINGENCY_STATUS];

// -----------------------------------------------------------------------------
// Entidades del dominio
// -----------------------------------------------------------------------------
export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: 'starter' | 'pro' | 'enterprise';
    settings: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Garment {
    id: string;
    organization_id: string;
    sku: string;
    name: string;
    description: string | null;
    category: string | null;
    size_label: string | null;
    chest_cm: number | null;
    waist_cm: number | null;
    hip_cm: number | null;
    length_cm: number | null;
    rental_price: number | null;
    sale_price: number | null;
    deposit_amount: number;
    operative_status: GarmentStatus;
    photos_urls: string[];
    tags: string[];
    notes: string | null;
    location_id: string | null;
    style_group_id: string | null;
    created_at: string;
    updated_at: string;
}

// Proyección ligera para el catálogo público (resultado de get_available_garments)
export interface GarmentSummary {
    id: string;
    name: string;
    sku: string;
    size_label: string | null;
    category: string | null;
    rental_price: number | null;
    deposit_amount: number;
    photos_urls: string[];
    chest_cm: number | null;
    waist_cm: number | null;
    hip_cm: number | null;
    tags: string[];
    style_group_id?: string | null;
    location_id?: string | null;
    location_name?: string | null;
}

export interface GarmentBlock {
    id: string;
    organization_id: string;
    garment_id: string;
    date_from: string;  // 'YYYY-MM-DD'
    date_to: string;  // 'YYYY-MM-DD'
    block_type: BlockType;
    source_id: string | null;
    source_type: string | null;
    released_at: string | null;
    released_by: string | null;
    release_reason: string | null;
    notes: string | null;
    created_at: string;
}

// Proyección de get_blocked_dates_for_garment
export interface BlockedDateRange {
    date_from: string;  // 'YYYY-MM-DD'
    date_to: string;  // 'YYYY-MM-DD'
    block_type: BlockType;
}

export interface Customer {
    id: string;
    organization_id: string;
    auth_user_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    id_document: string | null;
    id_document_type: string;
    is_blocked: boolean;
    block_reason: string | null;
    blocked_at: string | null;
    loyalty_points: number;
    notes: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Reservation {
    id: string;
    organization_id: string;
    customer_id: string;
    garment_id: string;
    event_date: string | null;
    pickup_date: string;
    return_date: string;
    status: ReservationStatus;
    contingency_status: ContingencyStatus;
    rental_price: number;
    deposit_amount: number;
    discount_amount: number;
    total_amount: number;
    mp_payment_id: string | null;
    mp_preference_id: string | null;
    mp_payment_status: string | null;
    actual_return_date: string | null;
    delivery_photos_urls: string[];
    return_photos_urls: string[];
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// -----------------------------------------------------------------------------
// Parámetros de las funciones de negocio
// -----------------------------------------------------------------------------
export interface AvailabilitySearchParams {
    pickupDate: string;  // 'YYYY-MM-DD'
    returnDate: string;  // 'YYYY-MM-DD'
    sizeLabel?: string;
    chestCm?: number;
    waistCm?: number;
    category?: string;
    maxPrice?: number;
    limit?: number;
    offset?: number;
}

export interface CreateReservationParams {
    garmentId: string;
    customerId: string;
    pickupDate: string;
    returnDate: string;
    eventDate?: string;
    rentalPrice: number;
    depositAmount: number;
}

export interface CreateReservationResult {
    reservation_id: string;
    block_id: string;
    status: ReservationStatus;
}

// -----------------------------------------------------------------------------
// Tipos de respuesta de Server Actions
// -----------------------------------------------------------------------------
export type ActionResult<T> =
    | { data: T; error: null }
    | { data: null; error: string; code?: string };

// Errores de negocio conocidos (mapeados desde los errores de la RPC)
export const BUSINESS_ERROR_CODES = {
    UNAUTHENTICATED: 'P0001',
    FORBIDDEN: 'P0002',
    BLOCKED_CUSTOMER: 'P0003',
    DATE_CONFLICT: 'P0004',
} as const;