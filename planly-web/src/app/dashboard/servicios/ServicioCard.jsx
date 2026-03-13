import Link from 'next/link';
import { MapPin, Clock, Users, Tag } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function ServicioCard({ servicio }) {
  return (
    <Card hover className="overflow-hidden group">
      {/* Imagen o placeholder */}
      <div className="h-44 bg-gradient-to-br from-cyan-400 to-slate-700 relative overflow-hidden">
        {servicio.imagen_principal ? (
          <img
            src={servicio.imagen_principal}
            alt={servicio.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-60">🏖️</span>
          </div>
        )}

        {/* Badge de promoción */}
        {servicio.tiene_promocion && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning">
              <Tag size={10} />
              {servicio.descuento_porcentaje}% OFF
            </Badge>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">
              {servicio.nombre}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{servicio.entidad_nombre}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            {servicio.tiene_promocion ? (
              <div>
                <p className="text-xs text-slate-400 line-through">
                  S/ {servicio.costo_regular}
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  S/ {servicio.precio_actual}
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-slate-900">
                S/ {servicio.precio_actual}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {servicio.descripcion}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-cyan-500" />
            {servicio.lugar}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-cyan-500" />
            {servicio.hora_inicio?.slice(0, 5)} — {servicio.hora_fin?.slice(0, 5)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} className="text-cyan-500" />
            Máx. {servicio.capacidad_maxima}
          </span>
        </div>

        <Link href={`/servicios/${servicio.id}`}>
          <button className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200">
            Ver detalles →
          </button>
        </Link>
      </div>
    </Card>
  );
}