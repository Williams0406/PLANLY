'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Building2, Compass, MapPin, Search, SlidersHorizontal, Sparkles, Tag } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { serviciosService } from '@/services/servicios.service';
import ServicioCard from '@/components/servicios/ServicioCard';

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body { font-family: 'DM Sans', sans-serif; }
    @keyframes rise {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .rise-a { animation: rise .7s ease both; }
    .rise-b { animation: rise .7s ease .12s both; }
    .rise-c { animation: rise .7s ease .24s both; }
  `}</style>
);

const slugify = (value) =>
  String(value || 'general')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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
    } catch (error) {
      console.error(error);
      setServicios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadServicios, 280);
    return () => clearTimeout(timer);
  }, [search, lugar, soloPromos]);

  const empresas = useMemo(() => {
    const grouped = servicios.reduce((acc, servicio) => {
      const key = servicio.entidad_nombre || 'Empresa sin nombre';

      if (!acc.has(key)) {
        acc.set(key, {
          entidadId: servicio.entidad,
          nombre: key,
          lugar: servicio.lugar || '',
          imagen: servicio.imagen_principal || '',
          servicios: [],
          categorias: new Set(),
        });
      }

      const empresa = acc.get(key);
      empresa.servicios.push(servicio);
      empresa.categorias.add(servicio.categoria || 'General');

      if (!empresa.entidadId && servicio.entidad) {
        empresa.entidadId = servicio.entidad;
      }
      if (!empresa.imagen && servicio.imagen_principal) {
        empresa.imagen = servicio.imagen_principal;
      }
      if (!empresa.lugar && servicio.lugar) {
        empresa.lugar = servicio.lugar;
      }
      return acc;
    }, new Map());

    return Array.from(grouped.values())
      .map((empresa) => ({
        ...empresa,
        categorias: Array.from(empresa.categorias),
      }))
      .sort((a, b) => b.servicios.length - a.servicios.length || a.nombre.localeCompare(b.nombre));
  }, [servicios]);

  const serviciosPorCategoria = useMemo(() => {
    const grouped = servicios.reduce((acc, servicio) => {
      const categoria = servicio.categoria || 'General';
      if (!acc.has(categoria)) {
        acc.set(categoria, []);
      }
      acc.get(categoria).push(servicio);
      return acc;
    }, new Map());

    return Array.from(grouped.entries())
      .map(([categoria, items]) => ({
        categoria,
        id: `categoria-${slugify(categoria)}`,
        items: items.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => b.items.length - a.items.length || a.categoria.localeCompare(b.categoria));
  }, [servicios]);

  const summary = useMemo(() => {
    const promos = servicios.filter((item) => item.tiene_promocion).length;
    const lugares = new Set(servicios.map((item) => item.lugar).filter(Boolean)).size;

    return [
      { label: 'Empresas activas', value: loading ? '...' : String(empresas.length) },
      { label: 'Servicios visibles', value: loading ? '...' : String(servicios.length) },
      { label: 'Categorías', value: loading ? '...' : String(serviciosPorCategoria.length) },
      { label: 'Destinos', value: loading ? '...' : String(lugares) },
      { label: 'Con descuento', value: loading ? '...' : String(promos) },
    ];
  }, [empresas.length, loading, servicios, serviciosPorCategoria.length]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-body">
      <FontStyle />
      <Navbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 pb-14 pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_.82fr]">
            <div>
              <div className="rise-a inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Catálogo público
              </div>
              <h1 className="rise-b font-display mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
                Empresas y servicios
                <span className="block bg-gradient-to-r from-cyan-600 to-sky-500 bg-clip-text text-transparent">
                  organizados por categoría.
                </span>
              </h1>
              <p className="rise-c mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Diseñamos el catálogo para que primero entiendas quién ofrece las experiencias, luego entres al perfil de la empresa y desde ahí explores sus servicios con mejor contexto.
              </p>
            </div>

            <div className="rise-c rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {summary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="font-display text-3xl font-extrabold text-cyan-700">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_.65fr_auto_auto]">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Buscar tours, experiencias, empresas o conceptos"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <MapPin className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Filtrar por lugar"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                />
              </div>

              <button
                onClick={() => setSoloPromos((prev) => !prev)}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                  soloPromos
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Tag className="h-4 w-4" />
                Solo descuentos
              </button>

              <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
                {loading ? 'Buscando...' : `${servicios.length} resultados`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="space-y-10">
              <div>
                <div className="mb-5 h-6 w-56 rounded-full bg-slate-200" />
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm animate-pulse">
                      <div className="h-40 bg-slate-100" />
                      <div className="space-y-4 p-6">
                        <div className="h-5 w-1/2 rounded bg-slate-200" />
                        <div className="h-3 w-2/3 rounded bg-slate-200" />
                        <div className="h-10 rounded-2xl bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-5 h-6 w-72 rounded-full bg-slate-200" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm animate-pulse">
                      <div className="h-48 bg-slate-100" />
                      <div className="space-y-4 p-5">
                        <div className="h-4 w-2/3 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                        <div className="h-3 w-full rounded bg-slate-200" />
                        <div className="h-11 rounded-2xl bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : servicios.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-slate-50 px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full bg-cyan-50">
                <Compass className="h-8 w-8 text-cyan-700" />
              </div>
              <h3 className="font-display text-3xl font-bold text-slate-900">No encontramos servicios con esos filtros</h3>
              <p className="mx-auto mt-4 max-w-lg text-slate-500">
                Prueba con otro destino, quita el filtro de promociones o usa una búsqueda más amplia.
              </p>
            </div>
          ) : (
            <div className="space-y-14">
              <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                      <Building2 className="h-3.5 w-3.5" />
                      Empresas
                    </div>
                    <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                      Empresas presentes en el catálogo
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Cada empresa abre ahora una vista pública propia con información comercial, galería, reseñas y todos sus servicios clasificados por categoría.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {serviciosPorCategoria.slice(0, 6).map((grupo) => (
                      <a
                        key={grupo.categoria}
                        href={`#${grupo.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        {grupo.categoria}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-3">
                  {empresas.map((empresa) => (
                    <Link
                      key={`${empresa.entidadId || empresa.nombre}-${empresa.nombre}`}
                      href={empresa.entidadId ? `/servicios/entidad/${empresa.entidadId}` : '#'}
                      className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(8,145,178,0.14)]"
                    >
                      <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,#ecfeff_0%,#f8fafc_100%)]">
                        {empresa.imagen ? (
                          <img
                            src={empresa.imagen}
                            alt={empresa.nombre}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <div className="rounded-full border border-cyan-200 bg-white/90 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                              {empresa.nombre}
                            </div>
                          </div>
                        )}

                        <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                          {empresa.servicios.length} servicios
                        </div>
                      </div>

                      <div className="space-y-5 p-6">
                        <div>
                          <h3 className="text-xl font-bold tracking-tight text-slate-950">{empresa.nombre}</h3>
                          <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4 text-cyan-600" />
                            <span>{empresa.lugar || 'Ubicación por confirmar'}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {empresa.categorias.slice(0, 4).map((categoria) => (
                            <span
                              key={categoria}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                            >
                              {categoria}
                            </span>
                          ))}
                          {empresa.categorias.length > 4 ? (
                            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                              +{empresa.categorias.length - 4} más
                            </span>
                          ) : null}
                        </div>

                        <p className="text-sm leading-7 text-slate-600">
                          Entra al perfil público de la empresa para revisar sus datos, sus imágenes promocionales y las reseñas antes de abrir un servicio específico.
                        </p>

                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
                          Ver empresa
                          <Building2 className="h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                      <Tag className="h-3.5 w-3.5" />
                      Categorías
                    </div>
                    <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                      Servicios clasificados por categoría
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      La exploración está organizada por intención. Cada bloque reúne servicios similares para que comparar sea natural y rápido.
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {serviciosPorCategoria.length} categorías activas en este momento
                  </p>
                </div>

                {serviciosPorCategoria.map((grupo) => (
                  <section
                    key={grupo.categoria}
                    id={grupo.id}
                    className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:p-8"
                  >
                    <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h3 className="font-display text-2xl font-extrabold tracking-tight text-slate-950">
                          {grupo.categoria}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {grupo.items.length} {grupo.items.length === 1 ? 'servicio disponible' : 'servicios disponibles'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[...new Set(grupo.items.map((item) => item.entidad_nombre).filter(Boolean))]
                          .slice(0, 4)
                          .map((nombre) => (
                            <span
                              key={nombre}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                            >
                              {nombre}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {grupo.items.map((servicio) => (
                        <ServicioCard key={servicio.id} servicio={servicio} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
