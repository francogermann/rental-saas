'use client';

import { useEffect, useState } from 'react';
import ClientDateSelector from '@/app/(storefront)/catalog/[garmentId]/ClientDateSelector';
import { ShoeRecommendationsRail } from '@/components/catalog/ShoeRecommendationsRail';
import type { GarmentSummary } from '@/types/domain';

type BookingRange = { pickupDate: string; returnDate: string };

export interface GarmentDetailBookingClientProps {
  garment: GarmentSummary;
  pickupLocationId: string;
  initialPickupDate: string;
  initialReturnDate: string;
}

export function GarmentDetailBookingClient({
  garment,
  pickupLocationId,
  initialPickupDate,
  initialReturnDate,
}: GarmentDetailBookingClientProps) {
  const [calendarOverride, setCalendarOverride] = useState<BookingRange | null>(null);

  useEffect(() => {
    setCalendarOverride(null);
  }, [initialPickupDate, initialReturnDate]);

  const activePickup = calendarOverride?.pickupDate ?? initialPickupDate;
  const activeReturn = calendarOverride?.returnDate ?? initialReturnDate;

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
        <h3 className="mb-6 font-display text-lg font-semibold tracking-tight">Seleccionar Fechas</h3>
        <ClientDateSelector
          garment={garment}
          pickupLocationId={pickupLocationId}
          onBookingDatesChange={setCalendarOverride}
        />
      </div>

      <ShoeRecommendationsRail pickupDate={activePickup} returnDate={activeReturn} />
    </>
  );
}
