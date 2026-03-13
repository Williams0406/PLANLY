'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Users, ArrowLeft, Tag, Building2 } from 'lucide-react';
import { serviciosService } from '@/services/servicios.service';
import Navbar from '@/components/layout/Navbar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function ServicioDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviciosService.getPublicoById(id)
      .then(setServicio)
      .catch(() => router.push('/servicios'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!servicio) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          {/* Imagen */}
          <div className="h-64 md:h-80 bg-gradient-to-br from-cyan-400 to-slate-700 relative">
            {servicio.imagen_principal ? (
              <img
                src={servicio.imagen_principal}
                alt={servicio.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl opacity-50">🏖️</span>
              </div>
            )}
            {servicio.tiene_promocion && (
              <div className="absolute top-4 left-4">
                <Badge variant="warning" className="text-sm px-3 py-1">
                  <Tag size={12} />
                  {servicio.descuento_porcentaje}% de descuento
                </Badge>
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{servicio.nombre}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-slate-500">{servicio.entidad_nombre}</span>
                </div>
              </div>

              <div className="text-right">
                {servicio.tiene_promocion ? (
                  <div>
                    <p className="text-slate-400 line-through text-sm">
                      S/ {servicio.costo_regular}
                    </p>
                    <p className="text-4xl font-bold text-emerald-600">
                      S/ {servicio.precio_actual}
                    </p>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-slate-900">
                    S/ {servicio.precio_actual}
                  </p>
                )}
                <p className="text-sm text-slate-400 mt-1">por persona</p>
              </div>
            </div>

            {/* Info rápida */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: MapPin, label: 'Lugar', value: servicio.lugar },
                {
                  icon: Clock,
                  label: 'Horario',
                  value: `${servicio.hora_inicio?.slice(0, 5)} — ${servicio.hora_fin?.slice(0, 5)}`,
                },
                { icon: Users, label: 'Capacidad', value: `Máx. ${servicio.capacidad_maxima} personas` },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Icon size={14} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-semibold text-slate-700">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Descripción */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Descripción</h2>
              <p className="text-slate-600 leading-relaxed">{servicio.descripcion}</p>
            </div>

            <Button size="lg" className="w-full md:w-auto px-12">
              Reservar ahora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}