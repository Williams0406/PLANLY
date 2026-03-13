import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
            <span className="text-cyan-400 text-sm font-medium">
              ✨ La app de viajes grupales más completa
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
            Organiza. Divide.
            <br />
            <span className="text-cyan-400">Disfruta.</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Planifica viajes grupales, controla gastos compartidos y descubre experiencias increíbles en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/servicios">
              <button className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-2xl text-lg transition-all shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50">
                Explorar servicios →
              </button>
            </Link>
            <Link href="/register?tipo=entidad">
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl text-lg transition-all">
                Soy proveedor 🏢
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-slate-500 text-center mb-12">
            Planly conecta viajeros con los mejores proveedores de experiencias
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: '🧭',
                title: 'Organiza viajes grupales',
                desc: 'Crea grupos, invita amigos y coordina cada detalle del viaje sin complicaciones.',
              },
              {
                emoji: '💰',
                title: 'Controla los gastos',
                desc: 'División automática de gastos, balance en tiempo real y cero discusiones sobre dinero.',
              },
              {
                emoji: '✨',
                title: 'Descubre experiencias',
                desc: 'Accede al catálogo de proveedores verificados y reserva actividades únicas.',
              },
            ].map((f) => (
              <div key={f.title} className="text-center p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{f.emoji}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Proveedores */}
      <section className="py-20 px-4 bg-gradient-to-r from-violet-600 to-violet-800">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿Ofreces servicios turísticos?
          </h2>
          <p className="text-violet-200 text-lg mb-8 leading-relaxed">
            Únete a Planly como proveedor, publica tus servicios y llega a miles de viajeros que buscan experiencias como la tuya.
          </p>
          <Link href="/register">
            <button className="px-8 py-4 bg-white text-violet-700 font-bold rounded-2xl text-lg hover:bg-violet-50 transition-all shadow-xl">
              Registrarse como proveedor →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        <p>© 2025 Planly · Organiza. Divide. Disfruta.</p>
      </footer>
    </div>
  );
}