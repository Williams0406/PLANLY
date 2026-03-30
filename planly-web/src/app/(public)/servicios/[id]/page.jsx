'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CreditCard,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { serviciosService } from '@/services/servicios.service';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

const formatDate = (value) =>
  new Date(value).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const getHorarios = (servicio) => {
  if (servicio.horarios?.length) {
    return servicio.horarios.map((horario) => ({
      key: `${horario.fecha_inicio}-${horario.fecha_fin}`,
      label: `${formatDate(horario.fecha_inicio)} - ${formatDate(horario.fecha_fin)}`,
    }));
  }
  if (servicio.hora_inicio && servicio.hora_fin) {
    return [{ key: 'simple', label: `${servicio.hora_inicio?.slice(0, 5)} - ${servicio.hora_fin?.slice(0, 5)}` }];
  }
  return [{ key: 'none', label: 'Sin horario definido' }];
};

export default function ServicioDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviciosService
      .getPublicoById(id)
      .then(setServicio)
      .catch(() => router.push('/servicios'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const horarios = useMemo(() => (servicio ? getHorarios(servicio) : []), [servicio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <FontStyle />
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!servicio) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-body">
      <FontStyle />
      <Navbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 pb-14 pt-20">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => router.back()}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a servicios
          </button>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Servicio destacado
              </div>
              <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
                {servicio.nombre}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-slate-700">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm">
                  <Building2 className="h-4 w-4 text-cyan-700" />
                  {servicio.entidad_nombre}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm">
                  <MapPin className="h-4 w-4 text-cyan-700" />
                  {servicio.lugar}
                </span>
              </div>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                {servicio.descripcion}
              </p>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50">
                {servicio.imagen_principal ? (
                  <img src={servicio.imagen_principal} alt={servicio.nombre} className="h-[320px] w-full object-cover" />
                ) : (
                  <div className="flex h-[320px] items-center justify-center bg-[linear-gradient(135deg,#e0f2fe,#f8fafc)]">
                    <div className="rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
                      Planly Service
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                {servicio.tiene_promocion ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400 line-through">S/ {servicio.costo_regular}</p>
                      <p className="font-display text-5xl font-extrabold text-emerald-600">S/ {servicio.precio_actual}</p>
                    </div>
                    <Badge variant="warning" className="px-3 py-1 text-sm">
                      <Tag className="h-3.5 w-3.5" />
                      {servicio.descuento_porcentaje}% OFF
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <p className="font-display text-5xl font-extrabold text-slate-950">S/ {servicio.precio_actual}</p>
                    <p className="mt-2 text-sm text-slate-500">Precio referencial por persona</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: MapPin, label: 'Ubicación', value: servicio.lugar },
                { icon: CalendarClock, label: 'Horario base', value: horarios[0]?.label || 'Sin horario' },
                { icon: Users, label: 'Capacidad', value: `Máx. ${servicio.capacidad_maxima} personas` },
                { icon: CreditCard, label: 'Pago', value: servicio.modalidad_pago_label || 'Pago completo' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
                  <div className="mb-4 inline-flex rounded-2xl bg-cyan-50 p-3">
                    <Icon className="h-5 w-5 text-cyan-700" />
                  </div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
              <h2 className="font-display text-3xl font-bold text-slate-950">Qué incluye este servicio</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {servicio.descripcion}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold text-slate-950">Forma de pago</h2>
                  <p className="text-sm text-slate-500">Información visible antes de reservar</p>
                </div>
              </div>
              <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-lg font-semibold text-emerald-900">
                  {servicio.modalidad_pago_label || 'Pago completo'}
                </p>
                <p className="mt-3 text-sm leading-7 text-emerald-800">
                  {servicio.forma_pago_resumen || 'El proveedor coordinará directamente la modalidad de pago del servicio.'}
                </p>
              </div>
            </div>

            {horarios.length > 1 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                <h2 className="font-display text-3xl font-bold text-slate-950">Horarios disponibles</h2>
                <div className="mt-6 grid gap-3">
                  {horarios.map((horario) => (
                    <div key={horario.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
                      {horario.label}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)] lg:sticky lg:top-24">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-700">Resumen rápido</p>
            <h3 className="font-display mt-4 text-3xl font-bold text-slate-950">Todo claro antes de decidir</h3>
            <div className="mt-6 space-y-4">
              {[
                ['Proveedor', servicio.entidad_nombre],
                ['Lugar', servicio.lugar],
                ['Pago', servicio.modalidad_pago_label || 'Pago completo'],
                ['Capacidad', `Máx. ${servicio.capacidad_maxima} personas`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <Button size="lg" className="mt-6 w-full rounded-2xl">
              Reservar ahora
            </Button>
            <p className="mt-3 text-center text-xs leading-6 text-slate-500">
              La reserva aún puede requerir confirmación final del proveedor.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
