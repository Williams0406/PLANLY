'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { serviciosService } from '@/services/servicios.service';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const getHorarioResumen = (servicio) => {
  if (servicio.horarios?.length) {
    const first = servicio.horarios[0];
    const start = new Date(first.fecha_inicio).toLocaleString();
    const end = new Date(first.fecha_fin).toLocaleString();
    const suffix = servicio.horarios.length > 1 ? ` (+${servicio.horarios.length - 1} mas)` : '';
    return `${start} - ${end}${suffix}`;
  }
  if (servicio.hora_inicio && servicio.hora_fin) {
    return `${servicio.hora_inicio} - ${servicio.hora_fin}`;
  }
  return 'Sin horario';
};

export default function MisServiciosPage() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = async () => {
    try {
      const data = await serviciosService.getMisServicios();
      setServicios(data.results || data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Desactivar "${nombre}"?`)) return;
    try {
      await serviciosService.delete(id);
      setMessage({ type: 'success', text: 'Servicio desactivado.' });
      load();
    } catch {
      setMessage({ type: 'error', text: 'Error al desactivar.' });
    }
  };

  const handleTogglePromo = async (s) => {
    try {
      if (s.tiene_promocion) {
        await serviciosService.desactivarPromocion(s.id);
      } else {
        await serviciosService.activarPromocion(s.id);
      }
      load();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Error.' });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Servicios</h1>
          <p className="text-slate-500 mt-1">
            {servicios.length} servicio{servicios.length !== 1 ? 's' : ''} publicado{servicios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/servicios/nuevo">
          <Button variant="purple">
            <Plus size={16} /> Nuevo servicio
          </Button>
        </Link>
      </div>

      {message.text && (
        <div className="mb-6">
          <Alert message={message.text} variant={message.type === 'success' ? 'success' : 'error'} />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : servicios.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-6xl mb-4">📦</p>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Sin servicios</h3>
          <p className="text-slate-500 mb-6">Crea tu primer servicio para aparecer en el catálogo</p>
          <Link href="/dashboard/servicios/nuevo">
            <Button variant="purple">Crear servicio</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {servicios.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏷️</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">{s.nombre}</h3>
                      <Badge variant={s.activo ? 'success' : 'error'}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {s.tiene_promocion && (
                        <Badge variant="warning">
                          <Tag size={10} /> Promo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 truncate">{s.lugar}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-slate-600">
                        Regular: <strong>S/ {s.costo_regular}</strong>
                      </span>
                      {s.costo_promocional && (
                        <span className="text-emerald-600">
                          Promo: <strong>S/ {s.costo_promocional}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{getHorarioResumen(s)}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.costo_promocional && (
                    <button
                      onClick={() => handleTogglePromo(s)}
                      className="p-2 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Toggle promoción"
                    >
                      {s.tiene_promocion
                        ? <ToggleRight size={20} className="text-amber-500" />
                        : <ToggleLeft size={20} className="text-slate-400" />
                      }
                    </button>
                  )}
                  <Link href={`/dashboard/servicios/${s.id}/editar`}>
                    <button className="p-2 hover:bg-violet-50 rounded-xl transition-colors">
                      <Pencil size={16} className="text-violet-600" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id, s.nombre)}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
