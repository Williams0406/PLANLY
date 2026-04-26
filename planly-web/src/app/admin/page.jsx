'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  Layers3,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';

const INITIAL_CATEGORY_FORM = {
  id: null,
  nombre: '',
  descripcion: '',
  orden: '0',
  activo: true,
};

const numberFormatter = new Intl.NumberFormat('es-PE');

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categoryForm, setCategoryForm] = useState(INITIAL_CATEGORY_FORM);
  const [savingCategory, setSavingCategory] = useState(false);
  const [actingEntityId, setActingEntityId] = useState(null);
  const [entityFilter, setEntityFilter] = useState('pendientes');
  const [entityQuery, setEntityQuery] = useState('');

  const loadData = async () => {
    try {
      const [dashboardData, entitiesData] = await Promise.all([
        adminService.getDashboard(),
        adminService.getEntidades(),
      ]);

      setDashboard(dashboardData);
      setEntities(entitiesData.results || entitiesData);
      if (!message.text) {
        setMessage({ type: '', text: '' });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'No pudimos cargar la consola administrativa. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = dashboard?.categorias || [];
  const stats = dashboard?.stats || {};
  const pendingPreview = dashboard?.pendientes_preview || [];

  const sortedCategoriesByViews = [...categories].sort(
    (first, second) =>
      (second.visualizaciones_count || 0) - (first.visualizaciones_count || 0) ||
      (second.servicios_count || 0) - (first.servicios_count || 0)
  );
  const maxViews = sortedCategoriesByViews[0]?.visualizaciones_count || 1;

  const filteredEntities = useMemo(() => {
    const query = entityQuery.trim().toLowerCase();

    return entities.filter((entity) => {
      if (entityFilter === 'pendientes' && entity.aprobado) return false;
      if (entityFilter === 'aprobadas' && !entity.aprobado) return false;

      if (!query) return true;
      const searchableText = [
        entity.nombre_comercial,
        entity.username,
        entity.email,
        entity.ruc,
        entity.direccion,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [entities, entityFilter, entityQuery]);

  const updateCategoryForm = (key, value) =>
    setCategoryForm((prev) => ({ ...prev, [key]: value }));

  const resetCategoryForm = () => setCategoryForm(INITIAL_CATEGORY_FORM);

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    if (!categoryForm.nombre.trim()) {
      setMessage({ type: 'error', text: 'La categoria necesita al menos un nombre.' });
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        nombre: categoryForm.nombre.trim(),
        descripcion: categoryForm.descripcion.trim(),
        orden: Number(categoryForm.orden || 0),
        activo: Boolean(categoryForm.activo),
      };

      if (categoryForm.id) {
        await adminService.updateCategoria(categoryForm.id, payload);
        setMessage({ type: 'success', text: 'Categoria actualizada correctamente.' });
      } else {
        await adminService.createCategoria(payload);
        setMessage({ type: 'success', text: 'Categoria creada correctamente.' });
      }

      resetCategoryForm();
      startTransition(() => {
        loadData();
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.nombre?.[0] || error.response?.data?.detail || 'No pudimos guardar la categoria.',
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      id: category.id,
      nombre: category.nombre || '',
      descripcion: category.descripcion || '',
      orden: String(category.orden ?? 0),
      activo: Boolean(category.activo),
    });
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Deseas eliminar la categoria "${category.nombre}"?`)) {
      return;
    }

    try {
      await adminService.deleteCategoria(category.id);
      setMessage({ type: 'success', text: 'Categoria eliminada correctamente.' });
      if (categoryForm.id === category.id) {
        resetCategoryForm();
      }
      startTransition(() => {
        loadData();
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || error.response?.data?.[0] || 'No pudimos eliminar la categoria.',
      });
    }
  };

  const handleToggleCategory = async (category) => {
    try {
      await adminService.updateCategoria(category.id, { activo: !category.activo });
      setMessage({
        type: 'success',
        text: `Categoria ${!category.activo ? 'activada' : 'desactivada'} correctamente.`,
      });
      startTransition(() => {
        loadData();
      });
    } catch {
      setMessage({ type: 'error', text: 'No pudimos actualizar el estado de la categoria.' });
    }
  };

  const handleApproveEntity = async (entity, shouldApprove) => {
    setActingEntityId(entity.id);
    try {
      if (shouldApprove) {
        await adminService.aprobarEntidad(entity.id);
        setMessage({ type: 'success', text: `Entidad aprobada: ${entity.nombre_comercial}.` });
      } else {
        await adminService.revocarEntidad(entity.id);
        setMessage({ type: 'success', text: `Aprobacion revocada: ${entity.nombre_comercial}.` });
      }

      startTransition(() => {
        loadData();
      });
    } catch {
      setMessage({ type: 'error', text: 'No pudimos actualizar el estado de la entidad.' });
    } finally {
      setActingEntityId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="admin-card h-48 animate-pulse rounded-[30px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message.text ? (
        <Alert
          message={message.text}
          variant={message.type === 'success' ? 'success' : 'error'}
        />
      ) : null}

      <section id="resumen" className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="admin-card relative overflow-hidden rounded-[32px] p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Vista ejecutiva
          </div>
          <h1 className="font-display mt-6 max-w-3xl text-5xl font-extrabold leading-[0.95] text-slate-950">
            Administra categorias, aprobaciones y salud operativa desde una sola consola.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Esta vista resume crecimiento, control editorial y actividad comercial para que puedas actuar rapido sin perder contexto.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Users}
              label="Usuarios persona"
              value={numberFormatter.format(stats.usuarios_persona || 0)}
              tone="bg-slate-900 text-white"
            />
            <MetricCard
              icon={Building2}
              label="Usuarios entidad"
              value={numberFormatter.format(stats.usuarios_entidad || 0)}
              tone="bg-emerald-600 text-white"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Entidades pendientes"
              value={numberFormatter.format(stats.entidades_pendientes || 0)}
              tone="bg-amber-500 text-slate-950"
            />
            <MetricCard
              icon={Eye}
              label="Visualizaciones"
              value={numberFormatter.format(stats.visualizaciones_totales || 0)}
              tone="bg-cyan-500 text-slate-950"
            />
          </div>
        </div>

        <div className="admin-card rounded-[32px] p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-emerald-700">Requiere atencion</p>
              <h2 className="font-display mt-3 text-3xl font-bold text-slate-950">Bandeja de aprobaciones</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {pendingPreview.length ? (
              pendingPreview.map((entity) => (
                <div key={entity.id} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-950">{entity.nombre_comercial}</p>
                  <p className="mt-1 text-sm text-slate-500">{entity.email}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                    Registro {formatDate(entity.date_joined)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No hay entidades pendientes en este momento.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="admin-card rounded-[32px] p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-emerald-700">Rendimiento editorial</p>
              <h2 className="font-display mt-3 text-3xl font-bold text-slate-950">Visualizaciones por categoria</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sortedCategoriesByViews.length ? (
              sortedCategoriesByViews.map((category) => (
                <div key={category.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{category.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {category.servicios_count || 0} servicios
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {numberFormatter.format(category.visualizaciones_count || 0)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{
                        width: `${Math.max(
                          10,
                          ((category.visualizaciones_count || 0) / maxViews) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Aun no hay categorias cargadas.
              </div>
            )}
          </div>
        </div>

        <div id="categorias" className="admin-card rounded-[32px] p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-emerald-700">Gobierno del catalogo</p>
              <h2 className="font-display mt-3 text-3xl font-bold text-slate-950">Categorias gestionables</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Crea nuevas categorias, ordénalas y decide cuales deben seguir disponibles para los proveedores.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              {numberFormatter.format(stats.categorias_activas || 0)} categorias activas
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={handleCategorySubmit} className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {categoryForm.id ? 'Editar categoria' : 'Nueva categoria'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Define nombre, descripcion, prioridad visual y estado.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Layers3 className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nombre"
                  value={categoryForm.nombre}
                  onChange={(event) => updateCategoryForm('nombre', event.target.value)}
                  placeholder="Ej. Experiencias premium"
                  required
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Descripcion</label>
                  <textarea
                    rows={4}
                    value={categoryForm.descripcion}
                    onChange={(event) => updateCategoryForm('descripcion', event.target.value)}
                    placeholder="Describe cuando o para que deberia usarse esta categoria."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Orden"
                    type="number"
                    value={categoryForm.orden}
                    onChange={(event) => updateCategoryForm('orden', event.target.value)}
                    placeholder="0"
                  />

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Estado</label>
                    <select
                      value={categoryForm.activo ? 'activo' : 'inactivo'}
                      onChange={(event) => updateCategoryForm('activo', event.target.value === 'activo')}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="activo">Activa</option>
                      <option value="inactivo">Inactiva</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={savingCategory} className="rounded-2xl">
                    <Plus className="h-4 w-4" />
                    {categoryForm.id ? 'Guardar cambios' : 'Crear categoria'}
                  </Button>
                  {categoryForm.id ? (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancelar edicion
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
              <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.8fr_0.9fr] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span>Categoria</span>
                <span>Estado</span>
                <span>Servicios</span>
                <span>Views</span>
                <span>Acciones</span>
              </div>

              <div className="divide-y divide-slate-200">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.8fr_0.9fr] gap-3 px-5 py-4 text-sm text-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{category.nombre}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500">
                        {category.descripcion || 'Sin descripcion adicional.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(category)}
                      className={`inline-flex h-fit items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                        category.activo
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {category.activo ? 'Activa' : 'Inactiva'}
                    </button>
                    <span className="font-semibold">{category.servicios_count || 0}</span>
                    <span className="font-semibold">{numberFormatter.format(category.visualizaciones_count || 0)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCategory(category)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                        title="Editar categoria"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                        title="Eliminar categoria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="aprobaciones" className="admin-card rounded-[32px] p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-emerald-700">Revision de entidades</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-slate-950">Aprobaciones con contexto</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Revisa negocios registrados, valida su estado actual y decide si ya pueden acceder al dashboard empresarial.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pendientes', label: 'Pendientes' },
              { id: 'aprobadas', label: 'Aprobadas' },
              { id: 'todas', label: 'Todas' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEntityFilter(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  entityFilter === item.id
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Input
            label="Buscar entidad"
            placeholder="Nombre comercial, usuario, email o RUC"
            value={entityQuery}
            onChange={(event) => setEntityQuery(event.target.value)}
          />
          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Resultados</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{filteredEntities.length}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {filteredEntities.map((entity) => (
            <article key={entity.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        entity.aprobado
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {entity.aprobado ? 'Aprobada' : 'Pendiente'}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {entity.username}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">{entity.nombre_comercial}</h3>
                  <p className="mt-2 text-sm text-slate-500">{entity.email}</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Views</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {numberFormatter.format(entity.visualizaciones_totales || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DataPill label="RUC" value={entity.ruc || 'No registrado'} />
                <DataPill label="Direccion" value={entity.direccion || 'No registrada'} />
                <DataPill label="Contacto" value={entity.contacto_referencia || 'Sin contacto'} />
                <DataPill label="Servicios activos" value={String(entity.servicios_activos || 0)} />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">
                  Registrada el <span className="font-semibold text-slate-800">{formatDate(entity.date_joined)}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={actingEntityId === entity.id}
                    onClick={() => handleApproveEntity(entity, !entity.aprobado)}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                      entity.aprobado
                        ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    } disabled:opacity-50`}
                  >
                    {actingEntityId === entity.id
                      ? 'Procesando...'
                      : entity.aprobado
                        ? 'Revocar aprobacion'
                        : 'Aprobar entidad'}
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!filteredEntities.length ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 xl:col-span-2">
              No encontramos entidades para este filtro.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={`rounded-[24px] p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DataPill({ label, value }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3.5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
    </div>
  );
}
