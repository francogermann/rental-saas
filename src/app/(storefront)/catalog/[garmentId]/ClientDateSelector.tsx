'use client';

import { useState } from 'react';
import { GarmentDateRangePicker } from '@/components/availability/GarmentDateRangePicker';
import { useCart } from '@/components/cart/CartContext';
import { checkGarmentAvailabilityAction } from '@/lib/actions/cart-availability';
import { formatUy } from '@/lib/utils';
import type { GarmentSummary } from '@/types/domain';

interface ClientDateSelectorProps {
  garment: GarmentSummary;
  pickupLocationId: string;
  initialPickupDate?: string;
  initialReturnDate?: string;
  urlRangeBlocked?: boolean;
  onBookingDatesChange?: (range: { pickupDate: string; returnDate: string } | null) => void;
}

export default function ClientDateSelector({
  garment,
  pickupLocationId,
  initialPickupDate,
  initialReturnDate,
  urlRangeBlocked = false,
  onBookingDatesChange,
}: ClientDateSelectorProps) {
  const { addItem } = useCart();
  const [selectedRange, setSelectedRange] = useState<{ pickupDate: string; returnDate: string } | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleRangeSelect = (range: { pickupDate: string; returnDate: string } | null) => {
    setSelectedRange(range);
    setAddError(null);
    onBookingDatesChange?.(range);
  };

  const handleReservation = async () => {
    if (!selectedRange || urlRangeBlocked) return;

    setIsAdding(true);
    setAddError(null);
    const check = await checkGarmentAvailabilityAction(
      garment.id,
      selectedRange.pickupDate,
      selectedRange.returnDate,
    );
    setIsAdding(false);

    if (!check.available) {
      setAddError(check.message ?? 'Esta prenda no está disponible para las fechas seleccionadas.');
      return;
    }

    addItem({
      garment,
      pickupDate: selectedRange.pickupDate,
      returnDate: selectedRange.returnDate,
      pickupLocationId,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <GarmentDateRangePicker
        garmentId={garment.id}
        initialPickupDate={initialPickupDate}
        initialReturnDate={initialReturnDate}
        onRangeSelect={handleRangeSelect}
      />

      {urlRangeBlocked ? (
        <p className="text-sm text-amber-200/90">
          Las fechas de la URL no están disponibles. Elegí otro rango en el calendario o unite a la lista de espera.
        </p>
      ) : null}

      {addError ? (
        <p className="text-sm text-destructive">{addError}</p>
      ) : null}

      {selectedRange && !urlRangeBlocked ? (
        <div className="mt-4 border-t border-white/10 pt-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground sm:text-sm">
              A abonar hoy:
            </span>
            <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-xl font-extrabold text-transparent sm:text-2xl">
              {formatUy((garment.rental_price || 0) + (garment.deposit_amount || 0))}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleReservation()}
            disabled={isAdding}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 font-semibold text-white shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-lg active:scale-95 disabled:opacity-50"
          >
            {isAdding ? 'Verificando disponibilidad…' : 'Añadir a la Reserva'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
