import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&q=80"
            alt="Vestido de gala"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240,18%,6%)] via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-fuchsia-400 font-medium uppercase tracking-[0.3em] text-sm mb-4">
              ✦ Vestí tu noche
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
              El alquiler de vestidos,{' '}
              <span className="bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent italic">
                reinventado.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-lg mb-10">
              La plataforma más completa, linda y fácil para alquilar el vestido perfecto para cada fiesta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center h-14 px-8 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold rounded-2xl shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg"
              >
                Ver Catálogo →
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl text-white font-semibold rounded-2xl transition-all duration-300"
              >
                ¿Cómo funciona?
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-14 pt-8 border-t border-white/10">
              {[
                { num: '+5000', label: 'Vestidos' },
                { num: 'Premium', label: 'Calidad' },
                { num: '100%', label: 'Online' },
                { num: 'Seguro', label: 'Y confiable' },
              ].map((b) => (
                <div key={b.label} className="text-center">
                  <p className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{b.num}</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sparkle particles (decorative) */}
        <div className="absolute top-20 right-20 w-1 h-1 bg-fuchsia-400 rounded-full animate-pulse" />
        <div className="absolute top-40 right-40 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-40 right-60 w-1 h-1 bg-pink-300 rounded-full animate-pulse delay-700" />
      </section>


      {/* ═══════════════════════════════════════════════════════
          FEATURES - "TODO LO QUE NECESITÁS"
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(315_100%_60%/.06),transparent_50%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">Todo lo que necesitás</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-8">
                En un solo lugar.
              </h2>
              <div className="space-y-6">
                {[
                  { icon: '✦', title: 'Catálogo deslumbrante', desc: 'Miles de vestidos de fiesta, graduación, casamiento y eventos.' },
                  { icon: '🔍', title: 'Búsqueda inteligente', desc: 'Filtrá por talla, color, estilo, evento y mucho más.' },
                  { icon: '📅', title: 'Reservas 100% online', desc: 'Elegí tus fechas, probáte, reservá. Así de fácil.' },
                  { icon: '📦', title: 'Envíos y devoluciones', desc: 'Envíos rápidos y devoluciones simples y sin estrés.' },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4 group">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-lg group-hover:bg-fuchsia-500/20 group-hover:shadow-glow transition-all duration-300">
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-0.5">{f.title}</h3>
                      <p className="text-muted-foreground text-sm">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Showcase Image */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-fuchsia-950/20">
              <Image
                src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=80"
                alt="Vestidos de gala"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">Simple y rápido</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-16">¿Cómo funciona?</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: '👗', title: 'Elegí', desc: 'Explorá nuestro catálogo y encontrá tu vestido ideal.' },
              { step: '02', icon: '📅', title: 'Reservá', desc: 'Seleccioná tus fechas y realizá tu reserva online.' },
              { step: '03', icon: '📍', title: 'Recibí', desc: 'Te lo acercamos a donde lo necesites, sin complicaciones.' },
              { step: '04', icon: '🎉', title: 'Disfrutá', desc: 'Lucí tu vestido increíble y devolvelo fácil.' },
            ].map((s) => (
              <div key={s.step} className="group flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 flex items-center justify-center text-3xl mb-5 group-hover:border-fuchsia-500/30 group-hover:shadow-glow transition-all duration-500">
                  {s.icon}
                </div>
                <p className="text-xs text-fuchsia-400 font-medium uppercase tracking-widest mb-2">{s.step}</p>
                <h3 className="font-display text-xl font-semibold mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          WHY CHOOSE US
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsl(285_100%_68%/.06),transparent_50%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">La diferencia</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">¿Por qué elegirnos?</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '💎', title: 'Calidad Premium', desc: 'Vestidos de diseñador y marcas exclusivas seleccionadas.' },
              { icon: '💰', title: 'Precios Accesibles', desc: 'Alquilá el vestido de tus sueños por menos.' },
              { icon: '🛡️', title: 'Confianza Total', desc: 'Procesos seguros y soporte siempre.' },
              { icon: '💖', title: 'Hecho con Amor', desc: 'Pensado para que vivas tu mejor experiencia.' },
            ].map((v) => (
              <div key={v.title} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:border-fuchsia-500/20 hover:shadow-glow transition-all duration-500 group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {v.icon}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">Historias reales</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Amadas por nuestras clientas</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { name: 'Martí R.', quote: '"El vestido llegó perfecto y me hizo sentir única. ¡Super recomendado!"' },
              { name: 'Lufi G.', quote: '"Increíble la calidad y la atención. Super recomendadas."' },
              { name: 'Vale T.', quote: '"La mejor experiencia de alquiler que tuve. Volveré siempre."' },
            ].map((t) => (
              <div key={t.name} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-fuchsia-500/20 transition-all duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <span className="font-semibold">{t.name}</span>
                  <div className="ml-auto text-fuchsia-400 text-sm">★★★★★</div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic">{t.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '+5000', label: 'Vestidos', icon: '👗' },
              { value: '+10K', label: 'Clientas felices', icon: '💖' },
              { value: '4.9/5', label: 'Calificación', icon: '⭐' },
              { value: '98%', label: 'Recomendadas', icon: '🔥' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-sm mb-1">{s.icon}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(315_100%_60%/.12),transparent_50%)]" />
        <div className="relative z-10 container mx-auto max-w-3xl">
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Lista para{' '}
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent italic">
              brillar?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Tu próximo vestido te está esperando. Explorá nuestra colección y reservá el tuyo ahora.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center h-14 px-10 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold rounded-2xl shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg"
          >
            Explorá el Catálogo →
          </Link>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="font-display text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
              Maison
            </p>
            <p className="text-xs text-muted-foreground mt-1">Más que un alquiler, somos parte de tu historia.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Maison Rentals. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
