'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Compass,
  LayoutDashboard,
  MapPin,
  Plus,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { serviciosService } from '@/services/servicios.service';
import Badge from '@/components/ui/Badge';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

function getCurrentPrice(servicio) {
  const fallbackPrice = servicio.tiene_promocion ? servicio.costo_promocional : servicio.costo_regular;
  return Number(servicio.precio_actual ?? fallbackPrice ?? 0);
}

function getDiscount(servicio) {
  if (!servicio.tiene_promocion) {
    return 0;
  }

  if (servicio.descuento_porcentaje) {
    return Number(servicio.descuento_porcentaje);
  }

  const regular = Number(servicio.costo_regular || 0);
  const promo = Number(servicio.costo_promocional || 0);

  if (!regular || promo >= regular) {
    return 0;
  }

  return Math.round(((regular - promo) / regular) * 100);
}

function getNextScheduleDate(servicio) {
  if (!servicio.horarios?.length) {
    return null;
  }

  const now = Date.now();

  const nextDates = servicio.horarios
    .map((horario) => new Date(horario.fecha_inicio))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now)
    .sort((a, b) => a.getTime() - b.getTime());

  return nextDates[0] || null;
}

function getScheduleLabel(servicio) {
  const nextDate = getNextScheduleDate(servicio);

  if (nextDate) {
    return dateFormatter.format(nextDate);
  }

  if (servicio.hora_inicio && servicio.hora_fin) {
    return `${servicio.hora_inicio} - ${servicio.hora_fin}`;
  }

  return 'Sin agenda visible';
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function StatCard({ icon: Icon, label, value, detail, progress, toneClass, barClass }) {
  return (
    <div className="dashboard-soft-surface dashboard-hover-lift rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 h-2 rounded-full bg-white/6">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barClass}`}
          style={{ width: `${Math.max(8, Math.min(progress, 100))}%` }}
        />
      </div>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="dashboard-surface rounded-[32px] p-8 text-center">
      <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-cyan-500/12 text-cyan-300">
        <BriefcaseBusiness className="h-8 w-8" />
      </div>
      <h3 className="font-display mt-6 text-3xl font-bold text-white">Tu dashboard esta listo para crecer</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
        Aun no tienes servicios publicados. Crea el primero para empezar a ver metricas, agenda y recomendaciones.
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          href="/dashboard/servicios/nuevo"
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          Crear primer servicio
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('todos');

  useEffect(() => {
    const loadServicios = async () => {
      try {
        const data = await serviciosService.getMisServicios();
        setServicios(data.results || data);
      } catch {
        setError('No pudimos cargar tus servicios. Intenta nuevamente en unos segundos.');
      } finally {
        setLoading(false);
      }
    };

    loadServicios();
  }, []);

  const totalServicios = servicios.length;
  const serviciosActivos = servicios.filter((servicio) => servicio.activo);
  const serviciosInactivos = servicios.filter((servicio) => !servicio.activo);
  const serviciosConPromo = servicios.filter((servicio) => servicio.tiene_promocion);
  const serviciosConAgenda = servicios
    .map((servicio) => {
      const nextSchedule = getNextScheduleDate(servicio);
      return nextSchedule ? { ...servicio, nextSchedule } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.nextSchedule.getTime() - b.nextSchedule.getTime());

  const destinosActivos = new Set(servicios.map((servicio) => servicio.lugar).filter(Boolean)).size;
  const categoriasActivas = [...new Set(servicios.map((servicio) => servicio.categoria || 'General'))];
  const capacidadTotal = servicios.reduce((total, servicio) => total + Number(servicio.capacidad_maxima || 0), 0);
  const precioPromedio = totalServicios
    ? Math.round(
        servicios.reduce((total, servicio) => total + getCurrentPrice(servicio), 0) / totalServicios
      )
    : 0;
  const descuentoPromedio = serviciosConPromo.length
    ? Math.round(
        serviciosConPromo.reduce((total, servicio) => total + getDiscount(servicio), 0) / serviciosConPromo.length
      )
    : 0;

  const serviceViews = [
    { id: 'todos', label: 'Todo el catalogo', count: totalServicios },
    { id: 'activos', label: 'Activos', count: serviciosActivos.length },
    { id: 'promo', label: 'En promocion', count: serviciosConPromo.length },
    { id: 'agenda', label: 'Con agenda', count: serviciosConAgenda.length },
  ];

  let spotlightItems = servicios;
  if (activeView === 'activos') {
    spotlightItems = serviciosActivos;
  }
  if (activeView === 'promo') {
    spotlightItems = serviciosConPromo;
  }
  if (activeView === 'agenda') {
    spotlightItems = serviciosConAgenda;
  }

  const checklist = [
    {
      label: 'Tienes al menos un servicio activo',
      done: serviciosActivos.length > 0,
    },
    {
      label: 'Ya existe una promo que ayude a convertir',
      done: serviciosConPromo.length > 0,
    },
    {
      label: 'Hay horarios futuros publicados',
      done: serviciosConAgenda.length > 0,
    },
    {
      label: 'Tu catalogo cubre mas de un destino',
      done: destinosActivos > 1,
    },
  ];

  const checklistDone = checklist.filter((item) => item.done).length;
  const checklistProgress = checklist.length ? (checklistDone / checklist.length) * 100 : 0;

  const opportunities = [];

  if (!totalServicios) {
    opportunities.push({
      title: 'Activa tu primera oferta',
      copy: 'Publica tu primer servicio para empezar a captar atencion y construir presencia.',
      href: '/dashboard/servicios/nuevo',
      cta: 'Crear servicio',
    });
  }

  if (totalServicios > 0 && !serviciosConPromo.length) {
    opportunities.push({
      title: 'Prueba una promocion limitada',
      copy: 'Un precio promocional visible puede ayudarte a destacar en temporadas altas.',
      href: '/dashboard/servicios',
      cta: 'Revisar catalogo',
    });
  }

  if (serviciosInactivos.length > 0) {
    opportunities.push({
      title: 'Reactiva servicios pausados',
      copy: `Tienes ${serviciosInactivos.length} servicio${serviciosInactivos.length === 1 ? '' : 's'} esperando volver a circular.`,
      href: '/dashboard/servicios',
      cta: 'Gestionarlos',
    });
  }

  if (serviciosActivos.length > 0 && serviciosConAgenda.length < serviciosActivos.length) {
    opportunities.push({
      title: 'Completa la agenda visible',
      copy: 'Agregar horarios futuros reduce friccion y genera mas confianza en quien explora tu oferta.',
      href: '/dashboard/servicios',
      cta: 'Actualizar horarios',
    });
  }

  if (!opportunities.length) {
    opportunities.push({
      title: 'Tu base se ve saludable',
      copy: 'Este es un buen momento para lanzar una experiencia premium o abrir un nuevo destino.',
      href: '/dashboard/servicios/nuevo',
      cta: 'Expandir catalogo',
    });
  }

  const stats = [
    {
      label: 'Servicios activos',
      value: serviciosActivos.length,
      detail: totalServicios
        ? `${Math.round((serviciosActivos.length / totalServicios) * 100)}% de tu catalogo esta visible.`
        : 'Activa tu primer servicio para comenzar.',
      progress: totalServicios ? (serviciosActivos.length / totalServicios) * 100 : 8,
      icon: TrendingUp,
      toneClass: 'bg-emerald-500/12 text-emerald-300',
      barClass: 'from-emerald-300 to-emerald-500',
    },
    {
      label: 'Promociones vivas',
      value: serviciosConPromo.length,
      detail: serviciosConPromo.length
        ? `Descuento promedio actual: ${descuentoPromedio}%.`
        : 'No tienes promociones activas por ahora.',
      progress: totalServicios ? (serviciosConPromo.length / totalServicios) * 100 : 8,
      icon: Tag,
      toneClass: 'bg-amber-500/12 text-amber-300',
      barClass: 'from-amber-300 to-amber-500',
    },
    {
      label: 'Agenda futura',
      value: serviciosConAgenda.length,
      detail: serviciosConAgenda.length
        ? 'Hay experiencias con horarios futuros visibles.'
        : 'Conviene publicar al menos una fecha proxima.',
      progress: totalServicios ? (serviciosConAgenda.length / totalServicios) * 100 : 8,
      icon: CalendarClock,
      toneClass: 'bg-cyan-500/12 text-cyan-300',
      barClass: 'from-cyan-300 to-sky-500',
    },
    {
      label: 'Capacidad total',
      value: capacidadTotal,
      detail: totalServicios
        ? `${formatCurrency(precioPromedio)} es tu precio promedio visible.`
        : 'Tu capacidad agregada aparecera aqui.',
      progress: Math.min(capacidadTotal, 100),
      icon: Users,
      toneClass: 'bg-violet-500/12 text-violet-300',
      barClass: 'from-violet-300 to-violet-500',
    },
  ];

  const firstName = user?.username?.split(' ')[0] || 'equipo';
  const summaryCopy = totalServicios
    ? `Hoy tienes ${serviciosActivos.length} servicio${serviciosActivos.length === 1 ? '' : 's'} activos, ${serviciosConPromo.length} con promocion y ${serviciosConAgenda.length} con agenda futura visible.`
    : 'Aun no hay publicaciones activas. Este espacio te ayudara a ordenar, lanzar y optimizar tu catalogo.';

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <div className="dashboard-surface h-72 animate-pulse rounded-[32px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="dashboard-soft-surface h-44 animate-pulse rounded-[28px]" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="dashboard-surface h-[30rem] animate-pulse rounded-[32px]" />
            <div className="space-y-6">
              <div className="dashboard-surface h-64 animate-pulse rounded-[32px]" />
              <div className="dashboard-surface h-56 animate-pulse rounded-[32px]" />
            </div>
          </div>
        </div>
      ) : !totalServicios ? (
        <EmptyPanel />
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="dashboard-surface dashboard-enter dashboard-hover-lift relative overflow-hidden rounded-[32px] p-8">
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="dashboard-chip text-xs font-semibold">
                <Sparkles className="h-4 w-4" />
                Vision general del negocio
              </div>

              <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="dashboard-kicker text-[11px] text-slate-500">Hola, {firstName}</p>
                  <h2 className="font-display mt-3 text-4xl font-extrabold leading-[0.95] text-white sm:text-5xl">
                    Asi se esta moviendo tu catalogo hoy.
                  </h2>
                  <p className="mt-5 text-base leading-8 text-slate-300">{summaryCopy}</p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/servicios/nuevo"
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
                    >
                      <Plus className="h-4 w-4" />
                      Publicar servicio
                    </Link>
                    <Link
                      href="/dashboard/servicios"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      Ver catalogo completo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-[330px]">
                  <div className="dashboard-soft-surface rounded-[24px] p-4">
                    <p className="text-sm text-slate-400">Cobertura actual</p>
                    <p className="mt-2 text-3xl font-bold text-white">{destinosActivos}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      destino{destinosActivos === 1 ? '' : 's'} visible{destinosActivos === 1 ? '' : 's'} en tu oferta.
                    </p>
                  </div>
                  <div className="dashboard-soft-surface rounded-[24px] p-4">
                    <p className="text-sm text-slate-400">Precio promedio</p>
                    <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(precioPromedio)}</p>
                    <p className="mt-2 text-sm text-slate-300">Valor visible promedio de tu catalogo.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-surface dashboard-enter rounded-[32px] p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="dashboard-kicker text-[11px] text-cyan-300/75">Salud del catalogo</p>
                  <h3 className="font-display mt-3 text-3xl font-bold text-white">Checklist de crecimiento</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    Una vista simple para saber si tu presencia ya transmite claridad y movimiento.
                  </p>
                </div>
                <div className="rounded-[24px] border border-cyan-400/16 bg-cyan-500/10 px-4 py-3 text-right">
                  <p className="text-xs text-cyan-300">Completado</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {checklistDone}/{checklist.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-3 rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-500"
                  style={{ width: `${Math.max(12, checklistProgress)}%` }}
                />
              </div>

              <div className="mt-6 space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3.5"
                  >
                    <p className="text-sm text-slate-200">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.done
                          ? 'border border-emerald-400/20 bg-emerald-500/12 text-emerald-300'
                          : 'border border-amber-400/20 bg-amber-500/12 text-amber-300'
                      }`}
                    >
                      {item.done ? 'Listo' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="dashboard-surface rounded-[32px] p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="dashboard-kicker text-[11px] text-cyan-300/75">Vista rapida</p>
                  <h3 className="font-display mt-3 text-3xl font-bold text-white">Servicios en foco</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    Cambia de vista para revisar lo activo, lo promocional o lo que ya tiene agenda visible.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {serviceViews.map((view) => (
                    <button
                      key={view.id}
                      type="button"
                      onClick={() => setActiveView(view.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeView === view.id
                          ? 'bg-cyan-500 text-slate-950'
                          : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {view.label} ({view.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {spotlightItems.slice(0, 4).map((servicio) => (
                  <Link
                    key={servicio.id}
                    href={`/dashboard/servicios/${servicio.id}/editar`}
                    className="dashboard-soft-surface dashboard-hover-lift block rounded-[28px] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={servicio.activo ? 'success' : 'gray'}>
                            {servicio.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {servicio.tiene_promocion ? (
                            <Badge variant="warning">Promo {getDiscount(servicio)}%</Badge>
                          ) : null}
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                            {servicio.categoria || 'General'}
                          </span>
                        </div>

                        <h4 className="mt-4 text-xl font-semibold text-white">{servicio.nombre}</h4>
                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-400">
                          {servicio.descripcion || 'Agrega una descripcion para comunicar mejor el valor de esta experiencia.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-cyan-300">
                        Editar
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <InfoTile icon={MapPin} label="Lugar" value={servicio.lugar || 'Por definir'} />
                      <InfoTile icon={CircleDollarSign} label="Precio actual" value={formatCurrency(getCurrentPrice(servicio))} />
                      <InfoTile icon={CalendarClock} label="Agenda" value={getScheduleLabel(servicio)} />
                    </div>
                  </Link>
                ))}

                {!spotlightItems.length ? (
                  <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] px-5 py-10 text-center text-sm text-slate-400">
                    No hay servicios para esta vista todavia. Cambia el filtro o publica una nueva experiencia.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="dashboard-surface rounded-[32px] p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="dashboard-kicker text-[11px] text-cyan-300/75">Radar del negocio</p>
                    <h3 className="font-display mt-3 text-3xl font-bold text-white">Cobertura y mezcla</h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-300">
                    <Compass className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Destinos" value={destinosActivos} />
                  <MiniMetric label="Categorias" value={categoriasActivas.length} />
                  <MiniMetric label="Capacidad" value={capacidadTotal} />
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-white">Categorias visibles</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categoriasActivas.slice(0, 6).map((categoria) => (
                      <span
                        key={categoria}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                      >
                        {categoria}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dashboard-surface rounded-[32px] p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="dashboard-kicker text-[11px] text-cyan-300/75">Oportunidades</p>
                    <h3 className="font-display mt-3 text-3xl font-bold text-white">Siguiente mejor paso</h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-300">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {opportunities.slice(0, 3).map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="dashboard-soft-surface dashboard-hover-lift block rounded-[26px] p-4"
                    >
                      <p className="text-base font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-400">{item.copy}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
                        {item.cta}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="dashboard-surface rounded-[32px] p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="dashboard-kicker text-[11px] text-cyan-300/75">Agenda cercana</p>
                    <h3 className="font-display mt-3 text-3xl font-bold text-white">Lo proximo por atender</h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-300">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {serviciosConAgenda.slice(0, 4).map((servicio) => (
                    <div
                      key={`agenda-${servicio.id}`}
                      className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{servicio.nombre}</p>
                          <p className="mt-1 text-sm text-slate-400">{servicio.lugar || 'Ubicacion por confirmar'}</p>
                        </div>
                        <Badge variant={servicio.activo ? 'success' : 'gray'}>
                          {servicio.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-medium text-cyan-300">
                        {dateFormatter.format(servicio.nextSchedule)}
                      </p>
                    </div>
                  ))}

                  {!serviciosConAgenda.length ? (
                    <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                      Aun no hay horarios futuros cargados.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[#07111F]/60 px-4 py-3.5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
