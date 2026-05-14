

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { ref?: string } }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-700">
      <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        ✓
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
        ¡Reserva Confirmada!
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
        Tu pago se ha procesado con éxito. Hemos registrado tu reserva y te esperamos en la fecha seleccionada para el retiro.
      </p>
      
      {searchParams.ref && (
        <div className="mb-12 p-4 bg-white/[0.02] border border-white/5 rounded-2xl w-full max-w-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Referencia de Operación</p>
          <p className="font-mono text-fuchsia-300">{searchParams.ref.split('-')[0]}</p>
        </div>
      )}

      <div className="flex gap-4">
        <a 
          href="/catalog" 
          className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-8 py-3.5 font-bold transition-colors"
        >
          Volver al Inicio
        </a>
      </div>
    </div>
  );
}
