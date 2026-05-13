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

  const handleReservation = async () => {
    if (!selectedRange) return;
    setIsReserving(true);
    router.push(`/checkout/${garmentId}?pickup=${selectedRange.pickupDate}&return=${selectedRange.returnDate}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <GarmentDateRangePicker
        garmentId={garmentId}
        onRangeSelect={setSelectedRange}
      />
      
      {selectedRange && (
        <div className="mt-4 pt-6 border-t border-white/10">
           <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">A abonar hoy:</span>
              <span className="font-extrabold text-2xl bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                ${(rentalPrice + depositAmount).toLocaleString('es-AR')}
              </span>
           </div>
           
           <button 
             onClick={handleReservation}
             disabled={isReserving}
             className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 disabled:opacity-50 py-3.5 rounded-2xl font-semibold shadow-glow hover:shadow-glow-lg transition-all duration-300"
           >
             {isReserving ? 'Procesando...' : 'Reservar Prenda Ahora'}
           </button>
        </div>
      )}
    </div>
  );
}
