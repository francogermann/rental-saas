import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { isMockCheckoutEnabled } from '@/lib/payments/checkout-mode';
import { MockPayClient } from './MockPayClient';

export const dynamic = 'force-dynamic';

export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: { refs?: string };
}) {
  if (!isMockCheckoutEnabled()) {
    notFound();
  }

  const refsRaw = searchParams.refs?.trim() ?? '';
  const ids = refsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from('reservations')
    .select('id, status, pickup_date, return_date, total_amount, garments(name)')
    .in('id', ids);

  if (error || !rows?.length) {
    notFound();
  }

  const lines = rows.map((r) => {
    const g = r.garments as { name?: string } | null;
    return {
      id: r.id,
      garmentName: g?.name ?? 'Prenda',
      pickupDate: r.pickup_date,
      returnDate: r.return_date,
      totalAmount: Number(r.total_amount ?? 0),
      status: r.status,
    };
  });

  const grandTotal = lines.reduce((sum, l) => sum + l.totalAmount, 0);

  return (
    <div className="min-h-screen py-24 px-6">
      <div className="container mx-auto max-w-lg">
        <Link href="/catalog" className="text-sm text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Volver al catálogo
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Simular pago</h1>
        <p className="text-muted-foreground mb-10 text-sm">
          Revisá el resumen y elegí el resultado para probar el flujo de checkout.
        </p>
        <MockPayClient refs={refsRaw} lines={lines} grandTotal={grandTotal} />
      </div>
    </div>
  );
}
