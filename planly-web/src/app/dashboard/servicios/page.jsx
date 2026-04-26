'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react';
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

function getHorarioResumen(servicio) {
  const nextDate = getNextScheduleDate(servicio);

  if (nextDate) {
    const extraCount = (servicio.horarios?.length || 1) - 1;
    return `${dateFormatter.format(nextDate)}${extraCount > 0 ? ` +${extraCount} mas` : ''}`;
  }

  if (servicio.hora_inicio && servicio.hora_fin) {
    return `${servicio.hora_inicio} - ${servicio.hora_fin}`;
  }

  return 'Sin horario visible';
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function sortServicios(servicios, sortBy) {
  const cloned = [...servicios];

  if (sortBy === 'precio') {
    return cloned.sort((a, b) => getCurrentPrice(b) - getCurrentPrice(a));
  }

  if (sortBy === 'capacidad') {
    return cloned.sort((a, b) => Number(b.capacidad_maxima || 0) - Number(a.capacidad_maxima || 0));
  }

  if (sortBy === 'agenda') {
    return cloned.sort((a, b) => {
      const firstDate = getNextScheduleDate(a)?.getTime() ?? Number.POSITIVE_INFINITY;
      const secondDate = getNextScheduleDate(b)?.getTime() ?? Number.POSITIVE_INFINITY;
      return firstDate - secondDate;
    });
  }

  return cloned.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function SummaryCard({ icon: Icon, label, value, detail, toneClass }) {
  return (
    <div className="dashboard-soft-surface rounded-[24px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function MisServiciosPage() {
  const searchParams = useSearchParams();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('nombre');
  const deferredQuery = useDeferredValue(query);

  const load = async () => {
    try {
      const data = await serviciosService.getMisServicios();
      setServicios(data.results || data);
      setError('');
    } catch {
      setError('No pudimos cargar tu catalogo. Vuelve a intentarlo en unos segundos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setMessage({ type: 'success', text: 'Servicio publicado correctamente.' });
      return;
    }

    if (searchParams.get('updated') === 'true') {
      setMessage({ type: 'success', text: 'Cambios guardados correctamente.' });
    }
  }, [searchParams]);

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`Deseas desactivar "${nombre}"?`)) {
      return;
    }

    try {
      await serviciosService.delete(id);
      setMessage({ type: 'success', text: 'Servicio desactivado.' });
      load();
    } catch {
      setMessage({ type: 'error', text: 'No pudimos desactivar el servicio.' });
    }
  };

  const handleTogglePromo = async (servicio) => {
    try {
      if (servicio.tiene_promocion) {
        await serviciosService.desactivarPromocion(servicio.id);
        setMessage({ type: 'success', text: 'Promocion desactivada.' });
      } else {
        await serviciosService.activarPromocion(servicio.id);
        setMessage({ type: 'success', text: 'Promocion activada.' });
      }

      load();
    } catch (event) {
      setMessage({
        type: 'error',
        text: event.response?.data?.error || 'No pudimos actualizar la promocion.',
      });
    }
  };

  const serviciosActivos = servicios.filter((servicio) => servicio.activo);
  const serviciosConPromo = servicios.filter((servicio) => servicio.tiene_promocion);
  const serviciosConAgenda = servicios.filter((servicio) => Boolean(getNextScheduleDate(servicio)));
  const capacidadTotal = servicios.reduce((total, servicio) => total + Number(servicio.capacidad_maxima || 0), 0);
  const precioPromedio = servicios.length
    ? Math.round(servicios.reduce((total, servicio) => total + getCurrentPrice(servicio), 0) / servicios.length)
    : 0;

  const filters = [
    { id: 'todos', label: 'Todos', count: servicios.length },
    { id: 'activos', label: 'Activos', count: serviciosActivos.length },
    { id: 'promo', label: 'Promocion', count: serviciosConPromo.length },
    { id: 'agenda', label: 'Con agenda', count: serviciosConAgenda.length },
    { id: 'inactivos', label: 'Inactivos', count: servicios.length - serviciosActivos.length },
  ];

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredServicios = servicios.filter((servicio) => {
    const searchableText = [
      servicio.nombre,
      servicio.descripcion,
      servicio.lugar,
      servicio.categoria,
      servicio.modalidad_pago_label,
      servicio.forma_pago_resumen,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

    if (!matchesQuery) {
      return false;
    }

    if (filter === 'activos') {
      return servicio.activo;
    }

    if (filter === 'promo') {
      return servicio.tiene_promocion;
    }

    if (filter === 'agenda') {
      return Boolean(getNextScheduleDate(servicio));
    }

    if (filter === 'inactivos') {
      return !servicio.activo;
    }

    return true;
  });

  const sortedServicios = sortServicios(filteredServicios, sortBy);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {message.text ? (
        <div
          className={clsx(
            'rounded-[24px] border px-5 py-4 text-sm',
            message.type === 'success'
              ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
              : 'border-red-400/20 bg-red-500/10 text-red-200'
          )}
        >
          {message.text}
        </div>
      ) : null}

      <section className="dashboard-surface rounded-[32px] p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="dashboard-chip text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              Catalogo inteligente
            </div>
            <h2 className="font-display mt-5 text-4xl font-extrabold leading-[0.98] text-white sm:text-5xl">
              Gestiona tus servicios con mas contexto y menos friccion.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Busca rapido, filtra lo importante y detecta que piezas de tu catalogo necesitan atencion inmediata.
            </p>
          </div>

          <Link
            href="/dashboard/servicios/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={BriefcaseBusiness}
            label="Servicios publicados"
            value={servicios.length}
            detail={`${serviciosActivos.length} activos y ${servicios.length - serviciosActivos.length} inactivos.`}
            toneClass="bg-cyan-500/12 text-cyan-300"
          />
          <SummaryCard
            icon={Tag}
            label="Promociones"
            value={serviciosConPromo.length}
            detail={
              serviciosConPromo.length
                ? `${Math.round(
                    serviciosConPromo.reduce((total, servicio) => total + getDiscount(servicio), 0) /
                      serviciosConPromo.length
                  )}% de descuento promedio.`
                : 'Sin precios promocionales activos.'
            }
            toneClass="bg-amber-500/12 text-amber-300"
          />
          <SummaryCard
            icon={CalendarClock}
            label="Agenda futura"
            value={serviciosConAgenda.length}
            detail="Servicios con al menos un horario proximo visible."
            toneClass="bg-violet-500/12 text-violet-300"
          />
          <SummaryCard
            icon={CircleDollarSign}
            label="Precio promedio"
            value={formatCurrency(precioPromedio)}
            detail={`Capacidad total publicada: ${capacidadTotal}.`}
            toneClass="bg-emerald-500/12 text-emerald-300"
          />
        </div>
      </section>

      <section className="dashboard-surface rounded-[32px] p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca por nombre, lugar, descripcion o modalidad de pago"
              className="w-full rounded-[24px] border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/30 focus:bg-white/[0.07]"
            />
          </label>

          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
            <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Ordenar</p>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-medium text-white outline-none"
              >
                <option value="nombre" className="bg-slate-900">
                  Nombre
                </option>
                <option value="precio" className="bg-slate-900">
                  Precio
                </option>
                <option value="capacidad" className="bg-slate-900">
                  Capacidad
                </option>
                <option value="agenda" className="bg-slate-900">
                  Agenda proxima
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <p>
            Mostrando <span className="font-semibold text-white">{sortedServicios.length}</span> de{' '}
            <span className="font-semibold text-white">{servicios.length}</span> servicio
            {servicios.length === 1 ? '' : 's'}.
          </p>
          {(normalizedQuery || filter !== 'todos' || sortBy !== 'nombre') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('todos');
                setSortBy('nombre');
              }}
              className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="dashboard-surface h-[26rem] animate-pulse rounded-[30px]" />
          ))}
        </div>
      ) : !servicios.length ? (
        <div className="dashboard-surface rounded-[32px] p-10 text-center">
          <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[26px] bg-cyan-500/12 text-cyan-300">
            <BriefcaseBusiness className="h-8 w-8" />
          </div>
          <h3 className="font-display mt-6 text-3xl font-bold text-white">Todavia no has publicado servicios</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Crea tu primera experiencia para empezar a gestionar precios, promociones y horarios desde este panel.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/dashboard/servicios/nuevo"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              Crear servicio
            </Link>
          </div>
        </div>
      ) : !sortedServicios.length ? (
        <div className="dashboard-surface rounded-[32px] p-10 text-center">
          <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[26px] bg-white/6 text-slate-300">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="font-display mt-6 text-3xl font-bold text-white">No encontramos coincidencias</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Ajusta la busqueda o cambia el filtro para volver a ver servicios.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {sortedServicios.map((servicio) => (
            <article key={servicio.id} className="dashboard-surface dashboard-hover-lift rounded-[30px] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-cyan-500/12 text-cyan-300">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>

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

                    <h3 className="font-display mt-4 text-2xl font-bold text-white">{servicio.nombre}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-400">
                      {servicio.descripcion || 'Agrega una descripcion mas rica para reforzar la propuesta de valor.'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {servicio.costo_promocional ? (
                    <button
                      type="button"
                      onClick={() => handleTogglePromo(servicio)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-slate-300 transition hover:border-amber-400/20 hover:bg-amber-500/10 hover:text-amber-300"
                      title={servicio.tiene_promocion ? 'Desactivar promocion' : 'Activar promocion'}
                    >
                      {servicio.tiene_promocion ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                  ) : null}

                  <Link
                    href={`/dashboard/servicios/${servicio.id}/editar`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-500/10 hover:text-cyan-300"
                    title="Editar servicio"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(servicio.id, servicio.nombre)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-slate-300 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
                    title="Desactivar servicio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailTile icon={MapPin} label="Lugar" value={servicio.lugar || 'Ubicacion por confirmar'} />
                <DetailTile icon={CalendarClock} label="Horario" value={getHorarioResumen(servicio)} />
                <DetailTile
                  icon={Users}
                  label="Capacidad"
                  value={`${Number(servicio.capacidad_maxima || 0)} persona${Number(servicio.capacidad_maxima || 0) === 1 ? '' : 's'}`}
                />
                <DetailTile
                  icon={WalletCards}
                  label="Pago"
                  value={servicio.forma_pago_resumen || servicio.modalidad_pago_label || 'Pendiente de definir'}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/8 pt-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Precio visible</p>
                  {servicio.tiene_promocion ? (
                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      <p className="text-sm text-slate-500 line-through">{formatCurrency(servicio.costo_regular)}</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(getCurrentPrice(servicio))}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(getCurrentPrice(servicio))}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {servicio.tiene_promocion ? (
                    <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                      Ahorras {getDiscount(servicio)}%
                    </span>
                  ) : null}

                  <Link
                    href={`/dashboard/servicios/${servicio.id}/editar`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Abrir detalle
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[#07111F]/60 px-4 py-3.5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-100">{value}</p>
    </div>
  );
}
