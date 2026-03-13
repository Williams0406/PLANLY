'use client';

import { useEffect, useState } from 'react';
import { Briefcase, TrendingUp, Star, Tag, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { serviciosService } from '@/services/servicios.service';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviciosService.getMisServicios()
      .then(data => setServicios(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: 'Total servicios',
      value: servicios.length,
      icon: Briefcase,
      color: 'violet',
    },
    {
      label: 'Activos',
      value: servicios.filter((s) => s.activo).length,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Con promoción',
      value: servicios.filter((s) => s.tiene_promocion).length,
      icon: Tag,
      color: 'amber',
    },
    {
      label: 'Rating',
      value: '⭐ N/A',
      icon: Star,
      color: 'cyan',
    },
  ];

  const COLOR_MAP = {
    violet: 'text-violet-600 bg-violet-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    cyan: 'text-cyan-600 bg-cyan-50',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Panel de Control
          </h1>
          <p className="text-slate-500 mt-1">
            Bienvenido de vuelta, <strong>{user?.username}</strong>
          </p>
        </div>
        <Link href="/dashboard/servicios/nuevo">
          <Button variant="purple">
            <Plus size={16} />
            Nuevo servicio
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
                <Icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Servicios recientes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Servicios recientes
        </h2>
        <Link
          href="/dashboard/servicios"
          className="text-sm text-violet-600 font-medium flex items-center gap-1 hover:underline"
        >
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : servicios.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-5xl mb-4">📦</p>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Sin servicios aún
          </h3>
          <p className="text-slate-500 mb-6">
            Publica tu primer servicio para aparecer en el catálogo
          </p>
          <Link href="/dashboard/servicios/nuevo">
            <Button variant="purple">Crear primer servicio</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {servicios.slice(0, 5).map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Briefcase size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{s.nombre}</p>
                    <p className="text-xs text-slate-500">{s.lugar}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">
                    S/ {s.costo_regular}
                  </span>
                  <Badge variant={s.activo ? 'success' : 'error'}>
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}