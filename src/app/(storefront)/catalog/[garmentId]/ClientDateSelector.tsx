'use client';

import { useState } from 'react';
import { GarmentDateRangePicker } from '@/components/availability/GarmentDateRangePicker';
import { useCart } from '@/components/cart/CartContext';
import { formatUy } from '@/lib/utils';
import type { GarmentSummary } from '@/types/domain';

interface ClientDateSelectorProps {
  garment: GarmentSummary;
  pickupLocationId: string;
  onBookingDatesChange?: (range: { pickupDate: string; returnDate: string } | null) => void;
}

export default function ClientDateSelector({
  garment,
  pickupLocationId,
  onBookingDatesChange,
}: ClientDateSelectorProps) {
  const { addItem } = useCart();
  const [selectedRange, setSelectedRange] = useState<{ pickupDate: string; returnDate: string } | null>(null);

  const handleRangeSelect = (range: { pickupDate: string; returnDate: string } | null) => {
    setSelectedRange(range);
    onBookingDatesChange?.(range);
  };

  const handleReservation = () => {
    if (!selectedRange) return;
    addItem({
      garment: garment,
      pickupDate: selectedRange.pickupDate,
      returnDate: selectedRange.returnDate,
      pickupLocationId,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <GarmentDateRangePicker garmentId={garment.id} onRangeSelect={handleRangeSelect} />
      
      {selectedRange && (
        <div className="mt-4 pt-6 border-t border-white/10">
           <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground sm:text-sm">A abonar hoy:</span>
              <span className="font-extrabold text-xl bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent sm:text-2xl">
                {formatUy((garment.rental_price || 0) + (garment.deposit_amount || 0))}
              </span>
           </div>
           
           <button 
             onClick={handleReservation}
             className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 py-3.5 rounded-2xl font-semibold shadow-glow hover:shadow-glow-lg transition-all duration-300"
           >
             Añadir a la Reserva
           </button>
        </div>
      )}
    </div>
  );
}
