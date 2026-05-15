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
  urlRangeBlocked?: boolean;
}

export function GarmentDetailBookingClient({
  garment,
  pickupLocationId,
  initialPickupDate,
  initialReturnDate,
  urlRangeBlocked = false,
}: GarmentDetailBookingClientProps) {
  const [calendarOverride, setCalendarOverride] = useState<BookingRange | null>(null);

  useEffect(() => {
    setCalendarOverride(null);
  }, [initialPickupDate, initialReturnDate]);

  const activePickup = calendarOverride?.pickupDate ?? initialPickupDate;
  const activeReturn = calendarOverride?.returnDate ?? initialReturnDate;

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-8">
        <h3 className="mb-4 font-display text-base font-semibold tracking-tight sm:mb-6 sm:text-lg">Seleccionar Fechas</h3>
        <ClientDateSelector
          garment={garment}
          pickupLocationId={pickupLocationId}
          initialPickupDate={initialPickupDate}
          initialReturnDate={initialReturnDate}
          urlRangeBlocked={urlRangeBlocked}
          onBookingDatesChange={setCalendarOverride}
        />
      </div>

      <ShoeRecommendationsRail pickupDate={activePickup} returnDate={activeReturn} />
    </>
  );
}
