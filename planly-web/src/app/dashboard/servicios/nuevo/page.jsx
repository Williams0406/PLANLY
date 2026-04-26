'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, Sparkles, WalletCards } from 'lucide-react';
import { serviciosService } from '@/services/servicios.service';
import ServicioForm from '@/components/servicios/ServicioForm';

export default function NuevoServicioPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data) => {
    setLoading(true);

    try {
      await serviciosService.create(data);
      router.push('/dashboard/servicios?created=true');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <section className="dashboard-surface rounded-[32px] p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="dashboard-chip text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              Lanzamiento
            </div>
            <h2 className="font-display mt-5 text-4xl font-extrabold leading-[0.98] text-white sm:text-5xl">
              Crea una experiencia clara, atractiva y lista para vender.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Mientras mas precisa sea la informacion base, mas confianza transmite tu servicio desde el primer vistazo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="dashboard-soft-surface rounded-[24px] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
                <CalendarClock className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold text-white">Agenda sin ambiguedad</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Publica horarios claros para reducir preguntas repetidas y acelerar reservas.
              </p>
            </div>
            <div className="dashboard-soft-surface rounded-[24px] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-300">
                <WalletCards className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold text-white">Pago bien explicado</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Cuando la dinamica de cobro se entiende rapido, la decision se vuelve mucho mas simple.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl">
        <ServicioForm onSubmit={handleSubmit} loading={loading} submitLabel="Publicar servicio" />
      </div>
    </div>
  );
}
