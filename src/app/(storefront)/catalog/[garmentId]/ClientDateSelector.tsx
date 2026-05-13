'use client';

import { useState } from 'react';
import { GarmentDateRangePicker } from '@/components/availability/GarmentDateRangePicker';
import { useRouter } from 'next/navigation';

interface ClientDateSelectorProps {
  garmentId: string;
  rentalPrice: number;
  depositAmount: number;
}

export default function ClientDateSelector({ garmentId, rentalPrice, depositAmount }: ClientDateSelectorProps) {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<{ pickupDate: string; returnDate: string } | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReservation = async () => {
    if (!selectedRange) return;
    setIsReserving(true);
    setError(null);

    // Transition to dynamic checkout page passing dates in searchParams
    router.push(`/checkout/${garmentId}?pickup=${selectedRange.pickupDate}&return=${selectedRange.returnDate}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <GarmentDateRangePicker
        garmentId={garmentId}
        onRangeSelect={setSelectedRange}
      />
      
      {selectedRange && (
        <div className="mt-4 pt-4 border-t border-border/40">
           <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">A abonar hoy:</span>
              <span className="font-extrabold text-2xl">${(rentalPrice + depositAmount).toLocaleString('es-AR')}</span>
           </div>
           
           <button 
             onClick={handleReservation}
             disabled={isReserving}
             className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 py-3 rounded-lg font-semibold shadow-md transition-all active:scale-[0.98]"
           >
             {isReserving ? 'Procesando...' : 'Reservar Prenda Ahora'}
           </button>
           {error && <p className="text-destructive text-sm mt-3 text-center bg-destructive/10 py-2 rounded-md">{error}</p>}
        </div>
      )}
    </div>
  );
}
