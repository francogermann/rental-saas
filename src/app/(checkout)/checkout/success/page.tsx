import Link from 'next/link';

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string; notice?: string };
}) {
  const notice = searchParams.notice ? decodeURIComponent(searchParams.notice) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-6 text-center animate-in fade-in zoom-in duration-700 max-w-lg mx-auto w-full">
      <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        ✓
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">¡Pago confirmado!</h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-4 leading-relaxed">
        Tu pago se procesó con éxito. Las fechas quedaron reservadas y te esperamos en el día de retiro.
      </p>
      {notice ? (
        <p className="text-sm text-amber-200/90 mb-8 max-w-md">{notice}</p>
      ) : null}

      {searchParams.ref && (
        <div className="mb-12 p-4 bg-white/[0.02] border border-white/5 rounded-2xl w-full max-w-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Referencia de operación</p>
          <p className="font-mono text-fuchsia-300">{searchParams.ref.split('-')[0]}</p>
        </div>
      )}

      <Link
        href="/catalog"
        className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-8 py-3.5 font-bold transition-colors"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}
