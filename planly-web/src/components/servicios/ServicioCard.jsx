import Link from 'next/link';
import { ArrowRight, Clock3, MapPin, Tag, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const getHorarioResumen = (servicio) => {
  if (servicio.horarios?.length) {
    const first = servicio.horarios[0];
    const start = new Date(first.fecha_inicio).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const end = new Date(first.fecha_fin).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const suffix = servicio.horarios.length > 1 ? ` +${servicio.horarios.length - 1}` : '';
    return `${start} - ${end}${suffix}`;
  }
  if (servicio.hora_inicio && servicio.hora_fin) {
    return `${servicio.hora_inicio?.slice(0, 5)} - ${servicio.hora_fin?.slice(0, 5)}`;
  }
  return 'Sin horario';
};

export default function ServicioCard({ servicio }) {
  return (
    <Card hover className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(14,116,144,0.16)]">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-cyan-100 via-sky-50 to-slate-100">
        {servicio.imagen_principal ? (
          <img
            src={servicio.imagen_principal}
            alt={servicio.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="rounded-full border border-cyan-200 bg-white/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
              Planly
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <Badge variant="info" className="rounded-full bg-white/90 px-3 py-1 text-cyan-700 shadow-sm">
            {servicio.entidad_nombre}
          </Badge>
          {servicio.tiene_promocion ? (
            <Badge variant="warning" className="rounded-full px-3 py-1 shadow-sm">
              <Tag className="h-3.5 w-3.5" />
              {servicio.descuento_porcentaje}% OFF
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold leading-tight text-slate-900">{servicio.nombre}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">{servicio.descripcion}</p>
          </div>
          <div className="text-right shrink-0">
            {servicio.tiene_promocion ? (
              <>
                <p className="text-xs text-slate-400 line-through">S/ {servicio.costo_regular}</p>
                <p className="text-2xl font-extrabold tracking-tight text-emerald-600">S/ {servicio.precio_actual}</p>
              </>
            ) : (
              <p className="text-2xl font-extrabold tracking-tight text-slate-900">S/ {servicio.precio_actual}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-cyan-600" />
            <span className="line-clamp-1">{servicio.lugar}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Clock3 className="h-4 w-4 text-cyan-600" />
            <span className="line-clamp-1">{getHorarioResumen(servicio)}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-cyan-600" />
            <span>Máx. {servicio.capacidad_maxima} personas</span>
          </div>
        </div>

        <Link
          href={`/servicios/${servicio.id}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Ver detalles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
