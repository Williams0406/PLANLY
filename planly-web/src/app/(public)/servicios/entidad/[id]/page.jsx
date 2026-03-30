'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  ImageIcon,
  MapPin,
  Phone,
  ReceiptText,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Badge from '@/components/ui/Badge';
import { serviciosService } from '@/services/servicios.service';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
  `}</style>
);

const slugify = (value) =>
  String(value || 'general')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';
  return new Date(value).toLocaleDateString('es-PE', {
    dateStyle: 'medium',
  });
};

const renderStars = (puntaje) =>
  Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`${puntaje}-${index}`}
      className={`h-4 w-4 ${index < puntaje ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
    />
  ));

export default function EntidadDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [entidad, setEntidad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviciosService
      .getEntidadPublica(id)
      .then(setEntidad)
      .catch(() => router.push('/servicios'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const serviciosPorCategoria = useMemo(() => {
    if (!entidad?.servicios?.length) return [];

    const grouped = entidad.servicios.reduce((acc, servicio) => {
      const categoria = servicio.categoria || 'General';
      if (!acc.has(categoria)) {
        acc.set(categoria, []);
      }
      acc.get(categoria).push(servicio);
      return acc;
    }, new Map());

    return Array.from(grouped.entries())
      .map(([categoria, items]) => ({
        categoria,
        id: `categoria-${slugify(categoria)}`,
        items: items.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => b.items.length - a.items.length || a.categoria.localeCompare(b.categoria));
  }, [entidad]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <FontStyle />
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!entidad) return null;

  const imagenes = entidad.imagenes_promocionales || [];
  const resenas = entidad.resenas || [];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-body">
      <FontStyle />
      <Navbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 pb-14 pt-20">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => router.back()}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </button>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Empresa verificada
              </div>
              <h1 className="font-display mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
                {entidad.nombre_comercial}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Revisa su identidad comercial, explora su portafolio por categoría y entra al detalle de cada servicio desde una sola vista clara y confiable.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Badge variant="info" className="px-4 py-2 text-sm">
                  <Star className="h-4 w-4 fill-current" />
                  {entidad.promedio_resenas || 0} de 5
                </Badge>
                <Badge variant="gray" className="px-4 py-2 text-sm">
                  {entidad.total_resenas || 0} reseñas
                </Badge>
                <Badge variant="gray" className="px-4 py-2 text-sm">
                  {entidad.servicios?.length || 0} servicios
                </Badge>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: ReceiptText, label: 'RUC', value: entidad.ruc || 'No disponible' },
                  { icon: Phone, label: 'Contacto', value: entidad.contacto_referencia || 'Por confirmar' },
                  { icon: MapPin, label: 'Dirección', value: entidad.direccion || 'Por confirmar' },
                  { icon: Building2, label: 'Categorías activas', value: `${serviciosPorCategoria.length} categorías` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                    <div className="mb-4 inline-flex rounded-2xl bg-cyan-50 p-3">
                      <Icon className="h-5 w-5 text-cyan-700" />
                    </div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="grid gap-4 sm:grid-cols-2">
                {imagenes.length ? (
                  imagenes.slice(0, 4).map((imagen, index) => (
                    <div
                      key={`${imagen}-${index}`}
                      className={`overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 ${
                        index === 0 ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <img
                        src={imagen}
                        alt={`${entidad.nombre_comercial} ${index + 1}`}
                        className={`w-full object-cover ${index === 0 ? 'h-64' : 'h-40'}`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ecfeff_0%,#f8fafc_100%)] sm:col-span-2">
                    <div className="text-center">
                      <div className="mx-auto mb-4 inline-flex rounded-full border border-cyan-200 bg-white px-5 py-4">
                        <ImageIcon className="h-6 w-6 text-cyan-700" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">La empresa aún no añadió imágenes promocionales</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                  <Tag className="h-3.5 w-3.5" />
                  Portafolio
                </div>
                <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                  Servicios clasificados por categoría
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Cada bloque reúne la oferta de esta empresa para que comparar sea más simple, más visual y con una ruta directa hacia el detalle del servicio.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {serviciosPorCategoria.map((grupo) => (
                  <a
                    key={grupo.id}
                    href={`#${grupo.id}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                  >
                    {grupo.categoria}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {serviciosPorCategoria.length ? (
                serviciosPorCategoria.map((grupo) => (
                  <section
                    key={grupo.id}
                    id={grupo.id}
                    className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 sm:p-6"
                  >
                    <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="font-display text-2xl font-extrabold tracking-tight text-slate-950">
                          {grupo.categoria}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {grupo.items.length} {grupo.items.length === 1 ? 'servicio disponible' : 'servicios disponibles'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {grupo.items.map((servicio) => (
                        <Link
                          key={servicio.id}
                          href={`/servicios/${servicio.id}`}
                          className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_60px_rgba(14,116,144,0.12)]"
                        >
                          <div className="relative h-48 overflow-hidden bg-[linear-gradient(135deg,#ecfeff_0%,#f8fafc_100%)]">
                            {servicio.imagen_principal ? (
                              <img
                                src={servicio.imagen_principal}
                                alt={servicio.nombre}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <div className="rounded-full border border-cyan-200 bg-white/90 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                                  {grupo.categoria}
                                </div>
                              </div>
                            )}

                            <div className="absolute left-4 top-4">
                              <Badge variant="info" className="bg-white/90 px-3 py-1 shadow-sm">
                                {grupo.categoria}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-lg font-bold leading-tight text-slate-950">{servicio.nombre}</h4>
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{servicio.descripcion}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-2xl font-extrabold tracking-tight text-emerald-600">S/ {servicio.precio_actual}</p>
                              </div>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4 text-cyan-600" />
                              <span className="line-clamp-1">{servicio.lugar || 'Ubicación por confirmar'}</span>
                            </div>

                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
                              Ver servicio
                              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
                  Esta empresa aún no tiene servicios públicos activos.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  <Star className="h-3.5 w-3.5" />
                  Reseñas
                </div>
                <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                  Lo que opinan sobre esta empresa
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  La reputación de la empresa queda visible desde el catálogo para que la decisión se sienta informada antes de entrar a cada servicio.
                </p>
              </div>

              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Promedio</p>
                <p className="font-display mt-2 text-4xl font-extrabold text-amber-700">{entidad.promedio_resenas || 0}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {resenas.length ? (
                resenas.map((resena) => (
                  <article
                    key={resena.id}
                    className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{resena.usuario_nombre}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(resena.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(resena.puntaje)}
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600">
                      {resena.comentario || 'Sin comentario adicional.'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="lg:col-span-2 rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
                  Esta empresa todavía no tiene reseñas públicas.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
