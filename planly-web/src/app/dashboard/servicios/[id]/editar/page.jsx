'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, Sparkles, Tag } from 'lucide-react';
import { serviciosService } from '@/services/servicios.service';
import ServicioForm from '@/components/servicios/ServicioForm';

export default function EditarServicioPage() {
  const { id } = useParams();
  const router = useRouter();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadServicio = async () => {
      const data = await serviciosService.getMisServicios();
      const all = data.results || data;
      const found = all.find((item) => item.id === Number(id));

      if (found) {
        setServicio(found);
        return;
      }

      router.push('/dashboard/servicios');
    };

    loadServicio();
  }, [id, router]);

  const handleSubmit = async (data) => {
    setLoading(true);

    try {
      await serviciosService.update(id, data);
      router.push('/dashboard/servicios?updated=true');
    } finally {
      setLoading(false);
    }
  };

  if (!servicio) {
    return (
      <div className="dashboard-surface flex min-h-[24rem] items-center justify-center rounded-[32px] p-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
          <p className="mt-4 text-sm text-slate-400">Cargando informacion del servicio...</p>
        </div>
      </div>
    );
  }

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
              Optimizacion
            </div>
            <h2 className="font-display mt-5 text-4xl font-extrabold leading-[0.98] text-white sm:text-5xl">
              Ajusta este servicio para que siga sintiendose actual y competitivo.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">{servicio.nombre}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="dashboard-soft-surface rounded-[24px] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
                <CalendarClock className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold text-white">Agenda visible</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                {servicio.horarios?.length
                  ? `${servicio.horarios.length} horario${servicio.horarios.length === 1 ? '' : 's'} cargado${servicio.horarios.length === 1 ? '' : 's'}.`
                  : 'Aun no hay horarios futuros cargados.'}
              </p>
            </div>
            <div className="dashboard-soft-surface rounded-[24px] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-300">
                <Tag className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-semibold text-white">Estado comercial</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                {servicio.tiene_promocion
                  ? 'Este servicio ya tiene una promocion lista para destacarse.'
                  : 'Puedes activar una promocion si quieres empujar conversion.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl">
        <ServicioForm
          initial={{
            ...servicio,
            capacidad_maxima: String(servicio.capacidad_maxima),
            costo_regular: String(servicio.costo_regular),
            costo_promocional: String(servicio.costo_promocional || ''),
          }}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
