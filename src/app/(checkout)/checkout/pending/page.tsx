import Link from 'next/link';

export default function CheckoutPendingPage({ searchParams }: { searchParams: { ref?: string } }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 text-center max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-bold mb-4">Pago en revisión</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Tu pago está siendo procesado. Cuando se confirme, las fechas quedarán reservadas y te avisaremos por
        email. Mientras tanto, esas fechas pueden seguir visibles para otras clientas.
      </p>
      {searchParams.ref ? (
        <p className="text-xs text-muted-foreground font-mono mb-8">Ref: {searchParams.ref}</p>
      ) : null}
      <Link
        href="/catalog"
        className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-8 py-3.5 font-bold transition-colors"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}
