import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  Compass,
  Layers3,
  LineChart,
  MapPinned,
  MessageSquareMore,
  Network,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  Users2,
  Wallet2,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }

    @keyframes rise {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes drift {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(0, -10px, 0); }
    }
    @keyframes pulseRing {
      0% { transform: scale(0.92); opacity: 0.35; }
      70% { transform: scale(1.06); opacity: 0.08; }
      100% { transform: scale(1.12); opacity: 0; }
    }
    @keyframes shine {
      from { transform: translateX(-140%); }
      to { transform: translateX(160%); }
    }

    .rise-1 { animation: rise .75s ease both; }
    .rise-2 { animation: rise .75s ease .12s both; }
    .rise-3 { animation: rise .75s ease .24s both; }
    .rise-4 { animation: rise .75s ease .36s both; }
    .float-card { animation: drift 5.2s ease-in-out infinite; }
    .pulse-ring::before {
      content: '';
      position: absolute;
      inset: -18px;
      border-radius: 999px;
      border: 1px solid rgba(34, 211, 238, 0.18);
      animation: pulseRing 2.8s ease-out infinite;
    }
    .glass-card {
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 24px 80px rgba(2, 8, 23, 0.35);
    }
    .grid-noise::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px);
      background-size: 56px 56px;
      mask-image: radial-gradient(circle at top, black 15%, transparent 72%);
    }
    .feature-card {
      transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease;
    }
    .feature-card:hover {
      transform: translateY(-5px);
      border-color: rgba(34, 211, 238, 0.25);
      box-shadow: 0 18px 50px rgba(8, 47, 73, 0.45);
    }
    .hero-button {
      position: relative;
      overflow: hidden;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .hero-button::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.18) 45%, transparent 65%);
      transform: translateX(-140%);
    }
    .hero-button:hover::after { animation: shine .8s ease; }
    .hero-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 40px rgba(8, 145, 178, 0.35);
    }
  `}</style>
);

const problems = [
  { icon: MessageSquareMore, title: 'Chats interminables', desc: 'La información importante se pierde entre audios, stickers y mensajes sueltos.' },
  { icon: ReceiptText, title: 'Cuentas sin contexto', desc: 'Nadie sabe cuánto falta, quién adelantó o quién sigue debiendo.' },
  { icon: Network, title: 'Responsables difusos', desc: 'Todos participan, pero nadie tiene claro quién reserva o confirma.' },
  { icon: MapPinned, title: 'Planes poco visibles', desc: 'Horarios, puntos de encuentro y cambios de último minuto terminan en caos.' },
];

const benefits = [
  { icon: CalendarRange, title: 'Itinerario grupal claro', desc: 'Cada actividad, horario y responsable vive en un mismo lugar y todos lo ven en tiempo real.' },
  { icon: Wallet2, title: 'Gastos sin fricciones', desc: 'Planly registra pagos, divide automáticamente y muestra balances actualizados.' },
  { icon: Users2, title: 'Roles mejor definidos', desc: 'El líder coordina y el grupo participa sin perder visibilidad ni orden.' },
  { icon: LineChart, title: 'Balance siempre visible', desc: 'Cada persona entiende en segundos cuánto debe, cuánto adelantó y qué ya quedó saldado.' },
  { icon: Compass, title: 'Servicios mejor curados', desc: 'Explora experiencias y operadores desde la misma plataforma, con contexto útil para decidir.' },
  { icon: Layers3, title: 'Una experiencia unificada', desc: 'Menos salto entre apps y más tiempo realmente disfrutando el viaje.' },
];

const workflow = [
  { step: '01', title: 'Armas el plan base', desc: 'Creas el viaje, defines fechas y organizas actividades con una estructura simple y visual.' },
  { step: '02', title: 'El grupo colabora', desc: 'Todos ven el mismo estado del viaje, mientras Planly mantiene orden en tareas, tiempos y gastos.' },
  { step: '03', title: 'Cierras sin incomodidad', desc: 'Los balances ya están calculados y el cierre del viaje se resuelve con claridad.' },
];

const modules = [
  { icon: CalendarRange, name: 'Planes', desc: 'Fechas, actividades y ritmo del viaje' },
  { icon: Users2, name: 'Contactos', desc: 'Grupos, roles y conexión entre personas' },
  { icon: Wallet2, name: 'Finanzas', desc: 'Movimientos, saldos y seguimiento total' },
  { icon: Store, name: 'Servicios', desc: 'Catálogo curado para descubrir opciones' },
];

function Eyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/8 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-300">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-slate-400">{copy}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07111F] text-white font-body">
      <FontStyle />
      <Navbar />

      <section className="relative overflow-hidden grid-noise">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(245,158,11,0.10),transparent_22%),linear-gradient(180deg,#07111F_0%,#091629_100%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 lg:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="rise-1">
                <Eyebrow>Organiza. Divide. Disfruta.</Eyebrow>
              </div>
              <h1 className="rise-2 font-display mt-7 text-5xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                El viaje grupal
                <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-sky-500 bg-clip-text text-transparent">
                  deja de sentirse caótico.
                </span>
              </h1>
              <p className="rise-3 mt-7 max-w-xl text-lg leading-8 text-slate-300">
                Planly convierte la coordinación del grupo en una experiencia visual, clara y confiable:
                itinerario, responsables, gastos y servicios en una sola plataforma.
              </p>
              <div className="rise-4 mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/register" className="hero-button inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-7 py-4 font-semibold text-slate-950">
                  Empezar gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#como-funciona" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-medium text-slate-200 transition hover:bg-white/10">
                  Ver cómo funciona
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-5 text-sm text-slate-400">
                <div className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-cyan-400" /> Gratis para empezar</div>
                <div className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400" /> Sin tarjeta de crédito</div>
              </div>
            </div>

            <div className="rise-4">
              <div className="float-card glass-card relative rounded-[30px] p-5">
                <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-cyan-300/80">Planly Dashboard</p>
                    <p className="font-display mt-1 text-2xl font-bold text-white">Cusco · Semana Santa</p>
                  </div>
                  <div className="pulse-ring relative flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/12">
                    <LineChart className="h-6 w-6 text-cyan-300" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-cyan-500/12 p-3"><CalendarRange className="h-5 w-5 text-cyan-300" /></div>
                      <div>
                        <p className="text-sm text-slate-400">Actividad siguiente</p>
                        <p className="font-semibold text-white">Salida a Ollantaytambo</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-300">08:00 AM · Responsable: Andrea</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-500/12 p-3"><Wallet2 className="h-5 w-5 text-emerald-300" /></div>
                      <div>
                        <p className="text-sm text-slate-400">Balance del grupo</p>
                        <p className="font-semibold text-white">S/ 324.00 registrados</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-300">2 personas deben regularizar hoy</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/8 bg-[#081728] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Movimientos recientes</p>
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">Tiempo real</span>
                  </div>
                  {[
                    ['Hospedaje', 'Diego adelantó', '+ S/ 280.00', 'text-emerald-300'],
                    ['Cena grupal', 'Pendiente de dividir', 'S/ 118.00', 'text-amber-300'],
                    ['Tour guiado', 'Saldo por confirmar', 'S/ 90.00', 'text-sky-300'],
                  ].map(([title, meta, amount, tone]) => (
                    <div key={title} className="flex items-center justify-between border-t border-white/6 py-3 first:border-t-0">
                      <div>
                        <p className="text-sm font-medium text-white">{title}</p>
                        <p className="text-xs text-slate-400">{meta}</p>
                      </div>
                      <span className={`text-sm font-semibold ${tone}`}>{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-6 sm:grid-cols-3">
            {[
              ['5 módulos', 'Todo el viaje conectado'],
              ['4 tipos de movimiento', 'Más control financiero'],
              ['1 solo flujo', 'Menos herramientas dispersas'],
            ].map(([value, label]) => (
              <div key={value} className="text-center">
                <p className="font-display text-3xl font-extrabold text-cyan-300">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A1626] px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="El problema"
            title="Los viajes en grupo fallan más por desorden que por falta de ganas."
            copy="Cuando la coordinación vive en varios lugares, el viaje se siente pesado antes de empezar."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {problems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card rounded-[26px] border border-white/8 bg-white/[0.04] p-6">
                <div className="mb-5 inline-flex rounded-2xl bg-white/6 p-3">
                  <Icon className="h-6 w-6 text-amber-300" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#07111F] px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="La solución"
            title="Planly ordena el viaje con una experiencia pensada para grupos reales."
            copy="No es solo una app de gastos ni solo una agenda. Es el sistema operativo del viaje en grupo."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card rounded-[26px] border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="rounded-2xl bg-cyan-500/10 p-3">
                    <Icon className="h-6 w-6 text-cyan-300" />
                  </div>
                  <Sparkles className="h-4 w-4 text-slate-500" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#0A1626] px-4 py-24">
        <div className="mx-auto grid max-w-6xl items-start gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Tres movimientos y el grupo ya está alineado.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Desde el armado inicial hasta el cierre financiero, Planly mantiene contexto, ritmo y claridad.
            </p>
            <div className="mt-10 space-y-6">
              {workflow.map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-sm font-semibold text-cyan-300">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/8 bg-white/[0.04] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {modules.map(({ icon: Icon, name, desc }) => (
                <div key={name} className="rounded-[24px] border border-white/8 bg-[#091629] p-5">
                  <div className="mb-4 inline-flex rounded-2xl bg-white/6 p-3">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-white">{name}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[24px] border border-cyan-500/15 bg-cyan-500/8 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Resultado</p>
              <p className="mt-3 text-lg leading-8 text-slate-200">
                Menos improvisación, menos conversaciones incómodas y más sensación de control para todo el grupo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#07111F] px-4 py-24">
        <div className="mx-auto max-w-5xl rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-10 text-center sm:p-14">
          <Eyebrow>Para proveedores</Eyebrow>
          <h2 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Si ofreces experiencias, Planly también puede ser tu vitrina.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Publica servicios, gana visibilidad y conecta con grupos que ya están en modo viaje y listos para decidir.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register?tipo=entidad" className="hero-button inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-7 py-4 font-semibold text-white">
              Registrarme como proveedor
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/servicios" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-medium text-slate-200 transition hover:bg-white/10">
              Ver catálogo actual
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              ['Sin comisión', 'Durante la etapa beta'],
              ['Audiencia segmentada', 'Grupos con intención real'],
              ['Reseñas verificadas', 'Más confianza al elegir'],
            ].map(([value, label]) => (
              <div key={value}>
                <p className="font-display text-2xl font-extrabold text-cyan-300">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0A1626] px-4 py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_45%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Eyebrow>Empieza hoy</Eyebrow>
          <h2 className="font-display mt-5 text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Tu próximo viaje merece una experiencia más clara.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Menos chats infinitos. Más visibilidad. Más tranquilidad para todo el grupo.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="hero-button inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-8 py-4 font-semibold text-slate-950">
              Crear mi primer plan
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/servicios" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-medium text-slate-200 transition hover:bg-white/10">
              Explorar experiencias
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/6 bg-[#07111F] px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image src="/images/LogoIcon.png" alt="Planly Logo" width={34} height={34} className="rounded-xl" />
            <div>
              <p className="font-semibold text-slate-200">Planly</p>
              <p>Organiza. Divide. Disfruta.</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/servicios" className="transition hover:text-slate-300">Servicios</Link>
            <Link href="/login" className="transition hover:text-slate-300">Iniciar sesión</Link>
            <Link href="/register" className="transition hover:text-slate-300">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
