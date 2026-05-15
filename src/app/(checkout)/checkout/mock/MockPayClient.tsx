'use client';

import { mockAbandonPayment, mockApprovePayment, mockRejectPayment } from '@/lib/actions/checkout-payment';

type Line = {
  id: string;
  garmentName: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: number;
  status: string;
};

export function MockPayClient({ refs, lines, grandTotal }: { refs: string; lines: Line[]; grandTotal: number }) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Modo simulación (desarrollo). No es un pago real. Las fechas se bloquean solo si simulás pago aprobado.
      </div>

      <ul className="space-y-4">
        {lines.map((line) => (
          <li key={line.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="font-medium">{line.garmentName}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Retiro: {line.pickupDate} · Devolución: {line.returnDate}
            </div>
            <div className="mt-2 text-sm">
              Total: ${line.totalAmount.toLocaleString('es-UY')} · Estado: {line.status}
            </div>
          </li>
        ))}
      </ul>

      <div className="text-lg font-semibold">Total: ${grandTotal.toLocaleString('es-UY')}</div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <form action={mockApprovePayment}>
          <input type="hidden" name="refs" value={refs} />
          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 font-semibold text-white transition"
          >
            Simular pago aprobado
          </button>
        </form>
        <form action={mockRejectPayment}>
          <input type="hidden" name="refs" value={refs} />
          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 px-6 py-3 font-semibold text-red-200 transition"
          >
            Simular pago rechazado
          </button>
        </form>
        <form action={mockAbandonPayment}>
          <input type="hidden" name="refs" value={refs} />
          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl border border-white/15 px-6 py-3 text-muted-foreground hover:text-foreground transition"
          >
            Abandonar
          </button>
        </form>
      </div>
    </div>
  );
}
