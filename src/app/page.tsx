import Link from 'next/link';
import Image from 'next/image';
import { SITE_LINKS } from '@/lib/site-links';

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
            src="https://images.unsplash.com/photo-1550639525-c97d455acf70?w=1400&q=80"
            alt="Vestido de gala"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240,18%,6%)] via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-fuchsia-400 font-medium uppercase tracking-[0.3em] text-sm mb-4">
              ✦ #TuMejorVersion
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
              Alquilá el vestido de tus{' '}
              <span className="bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent italic">
                sueños.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-lg mb-10">
              La plataforma más completa para encontrar el vestido perfecto para cada fiesta. Sin agenda previa.
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
            <div className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/10">
              {[
                { num: '+1000', label: 'Vestidos' },
                { num: '46K+', label: 'Seguidoras' },
                { num: 'XS–XXL', label: 'Talles' },
                { num: '2', label: 'Locales' },
              ].map((b) => (
                <div key={b.label} className="text-center">
                  <p className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{b.num}</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          FEATURES - "TODO LO QUE NECESITÁS"
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
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
                  { icon: '✦', title: 'Catálogo deslumbrante', desc: 'Vestidos de fiesta, graduación, casamiento y eventos de gala.' },
                  { icon: '🔍', title: 'Búsqueda inteligente', desc: 'Filtrá por talla, color, estilo, evento y disponibilidad.' },
                  { icon: '📅', title: 'Reservas 100% online', desc: 'Elegí tus fechas, reservá y listo. Sin agenda previa.' },
                  { icon: '📍', title: 'Dos locales a tu servicio', desc: 'Montevideo (Micenas Mall) y Colonia (Av Artigas 316).' },
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
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">Simple y rápido</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-16">¿Cómo funciona?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: '👗', title: 'Elegí', desc: 'Explorá nuestro catálogo online y elegí hasta 4 vestidos.' },
              { step: '02', icon: '📅', title: 'Reservá', desc: 'Seleccioná tus fechas y reservá sin agenda previa.' },
              { step: '03', icon: '✨', title: 'Probate', desc: 'Vení al local, probate los vestidos y elegí tu favorito.' },
              { step: '04', icon: '🎉', title: 'Brillá', desc: 'Lucí espectacular en tu evento y devolvelo fácil.' },
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
      <section id="sobre-nosotros" className="relative scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsl(285_100%_68%/.06),transparent_50%)]" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">La experiencia Carpe Diem</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">¿Por qué elegirnos?</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '💎', title: 'Calidad Premium', desc: 'Vestidos de diseñador, importados y exclusivos.' },
              { icon: '👗', title: 'Talles XS a XXL', desc: 'Inclusivas siempre. Vestidos para todos los cuerpos.' },
              { icon: '🛡️', title: 'Sin agenda previa', desc: 'Vení cuando quieras, te atendemos sin turno.' },
              { icon: '💖', title: '#TuMejorVersion', desc: 'Queremos que te sientas espectacular esa noche.' },
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
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">Historias reales</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Amadas por nuestras clientas</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { name: 'Martina R.', quote: '"Me encantó la atención y la variedad. El vestido me quedó perfecto. ¡Volveré seguro!"' },
              { name: 'Lucía G.', quote: '"Fui sin turno y salí con un vestido impresionante. La experiencia fue increíble de principio a fin."' },
              { name: 'Valentina T.', quote: '"La mejor experiencia de alquiler que tuve. Recomiendo Carpe Diem a todas mis amigas."' },
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
      <section className="py-16 px-4 sm:px-6 border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '+1000', label: 'Vestidos', icon: '👗' },
              { value: '46K+', label: 'Seguidoras', icon: '💖' },
              { value: '4.9/5', label: 'Calificación', icon: '⭐' },
              { value: '98%', label: 'Recomiendan', icon: '🔥' },
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
          LOCATIONS
      ═══════════════════════════════════════════════════════ */}
      <section id="contacto" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">Visitanos</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Nuestros Locales</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { city: 'Montevideo', address: 'Av Brasil 3072, Local 9', detail: 'Micenas Mall', icon: '🏙️' },
              { city: 'Colonia', address: 'Av Artigas 316', detail: 'Centro', icon: '🌊' },
            ].map((loc) => (
              <div key={loc.city} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:border-fuchsia-500/20 hover:shadow-glow transition-all duration-500">
                <span className="text-4xl mb-4 block">{loc.icon}</span>
                <h3 className="font-display text-2xl font-bold mb-2">{loc.city}</h3>
                <p className="text-muted-foreground">{loc.address}</p>
                <p className="text-muted-foreground text-sm">{loc.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(315_100%_60%/.05),transparent_50%)]" />
        <div className="container mx-auto max-w-3xl relative z-10">
          <div className="text-center mb-16">
            <p className="text-fuchsia-400 font-medium uppercase tracking-widest text-sm mb-3">Preguntas Frecuentes</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">FAQ</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Qué pasa si no me queda el vestido?',
                a: 'Al venir al local sin agenda previa, podés probarte hasta 4 vestidos. Si ninguno te convence, no hay compromiso. Queremos que te sientas 100% segura con tu elección.'
              },
              {
                q: '¿Puedo cambiar la fecha de mi reserva?',
                a: 'Sí, podés modificar la fecha de tu reserva contactándonos por WhatsApp o directamente en el local, sujeto a disponibilidad del vestido para las nuevas fechas.'
              },
              {
                q: '¿Qué pasa si el vestido se daña?',
                a: 'Los accidentes pasan. Al momento de retirar el vestido se firma un acuerdo que detalla las condiciones. Daños menores habituales (como un pequeño enganche) están contemplados. Para daños mayores, se evalúa caso a caso.'
              },
              {
                q: '¿Con cuánta anticipación debo reservar?',
                a: 'Recomendamos reservar con al menos 1–2 semanas de anticipación para tener la mayor variedad disponible. Para temporada alta (fiestas de fin de año, graduaciones), idealmente con 1 mes de antelación.'
              },
            ].map((faq) => (
              <details key={faq.q} className="group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-fuchsia-500/20 transition-all duration-300">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-lg list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="text-fuchsia-400 text-2xl ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(315_100%_60%/.12),transparent_50%)]" />
        <div className="relative z-10 container mx-auto max-w-3xl">
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Lista para{' '}
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent italic">
              brillar?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Tu próximo vestido te está esperando. Explorá nuestra colección y reservá el tuyo sin agenda previa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center h-14 px-10 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold rounded-2xl shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg"
            >
              Explorá el Catálogo →
            </Link>
            <a
              href={SITE_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-14 px-10 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl text-white font-semibold rounded-2xl transition-all duration-300 text-lg"
            >
              WhatsApp 📱
            </a>
          </div>
        </div>
      </section>


    </div>
  );
}
