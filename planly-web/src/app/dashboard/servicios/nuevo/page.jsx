'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { serviciosService } from '@/services/servicios.service';
import ServicioForm from '@/components/servicios/ServicioForm';
import Card from '@/components/ui/Card';

export default function NuevoServicioPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await serviciosService.create(data);
      router.push('/dashboard/servicios?created=true');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nuevo servicio</h1>
        <p className="text-slate-500 mt-1">
          Completa la información de tu servicio
        </p>
      </div>

      <Card className="p-8">
        <ServicioForm
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Publicar servicio"
        />
      </Card>
    </div>
  );
}