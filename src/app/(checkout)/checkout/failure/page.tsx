export default function CheckoutFailurePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-destructive/20 text-destructive rounded-full flex items-center justify-center text-4xl mb-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        ✕
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
        Algo salió mal
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
        No pudimos procesar tu pago a través de MercadoPago. Tu reserva no ha sido confirmada.
      </p>
      
      <div className="flex gap-4">
        <a 
          href="/checkout" 
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl px-8 py-3.5 font-bold transition-colors shadow-glow"
        >
          Intentar de nuevo
        </a>
        <a 
          href="/catalog" 
          className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-8 py-3.5 font-bold transition-colors"
        >
          Volver al Catálogo
        </a>
      </div>
    </div>
  );
}
