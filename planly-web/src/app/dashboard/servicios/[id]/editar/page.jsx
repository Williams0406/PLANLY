'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { serviciosService } from '@/services/servicios.service';
import ServicioForm from '@/components/servicios/ServicioForm';
import Card from '@/components/ui/Card';

export default function EditarServicioPage() {
  const { id } = useParams();
  const router = useRouter();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    serviciosService.getMisServicios().then((data) => {
      const all = data.results || data;
      const found = all.find((s) => s.id === Number(id));
      if (found) setServicio(found);
      else router.push('/dashboard/servicios');
    });
  }, [id]);

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
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Editar servicio</h1>
        <p className="text-slate-500 mt-1">{servicio.nombre}</p>
      </div>

      <Card className="p-8">
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
      </Card>
    </div>
  );
}