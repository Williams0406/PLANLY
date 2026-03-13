'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Tag } from 'lucide-react';
import { serviciosService } from '@/services/servicios.service';
import ServicioCard from '@/components/servicios/ServicioCard';
import Navbar from '@/components/layout/Navbar';

export default function ServiciosPage() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lugar, setLugar] = useState('');
  const [soloPromos, setSoloPromos] = useState(false);

  const loadServicios = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (lugar) params.lugar = lugar;
      if (soloPromos) params.promocion = 'true';
      const data = await serviciosService.getPublicos(params);
      setServicios(data.results || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadServicios, 300);
    return () => clearTimeout(timer);
  }, [search, lugar, soloPromos]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Descubre experiencias
            <span className="text-cyan-400"> únicas</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Explora los mejores servicios turísticos verificados por Planly
          </p>

          {/* Buscador */}
          <div className="relative max-w-xl mx-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl
                pl-12 pr-4 py-4 text-white placeholder-slate-400 text-sm
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              placeholder="Buscar tours, actividades, restaurantes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2">
            <MapPin size={14} className="text-slate-400" />
            <input
              className="text-sm focus:outline-none w-36"
              placeholder="Filtrar por lugar"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
            />
          </div>

          <button
            onClick={() => setSoloPromos(!soloPromos)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              soloPromos
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Tag size={14} />
            Solo con descuento
          </button>

          <span className="flex items-center text-sm text-slate-500 ml-auto">
            <SlidersHorizontal size={14} className="mr-1" />
            {loading ? 'Buscando...' : `${servicios.length} resultados`}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : servicios.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Sin resultados
            </h3>
            <p className="text-slate-500">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {servicios.map((s) => (
              <ServicioCard key={s.id} servicio={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}