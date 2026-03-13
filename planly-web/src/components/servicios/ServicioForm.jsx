'use client';

import { useState } from 'react';
import { MapPin, Clock, Users, DollarSign, Tag, FileText, Phone } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const INITIAL = {
  nombre: '',
  descripcion: '',
  hora_inicio: '08:00:00',
  hora_fin: '18:00:00',
  capacidad_maxima: '',
  costo_regular: '',
  tiene_promocion: false,
  costo_promocional: '',
  lugar: '',
  contacto_referencia: '',
};

export default function ServicioForm({ initial = {}, onSubmit, loading, submitLabel = 'Guardar' }) {
  const [form, setForm] = useState({ ...INITIAL, ...initial });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.descripcion.trim()) e.descripcion = 'Requerido';
    if (!form.lugar.trim()) e.lugar = 'Requerido';
    if (!form.contacto_referencia.trim()) e.contacto_referencia = 'Requerido';
    if (!form.capacidad_maxima || Number(form.capacidad_maxima) <= 0)
      e.capacidad_maxima = 'Debe ser mayor a 0';
    if (!form.costo_regular || Number(form.costo_regular) <= 0)
      e.costo_regular = 'Debe ser mayor a 0';
    if (form.tiene_promocion) {
      if (!form.costo_promocional) e.costo_promocional = 'Requerido';
      if (Number(form.costo_promocional) >= Number(form.costo_regular))
        e.costo_promocional = 'Debe ser menor al precio regular';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;

    try {
      await onSubmit({
        ...form,
        capacidad_maxima: Number(form.capacidad_maxima),
        costo_regular: Number(form.costo_regular),
        costo_promocional: form.tiene_promocion
          ? Number(form.costo_promocional)
          : null,
      });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v;
        });
        setErrors(fieldErrors);
      } else {
        setGlobalError('Error al guardar. Verifica los datos.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert message={globalError} />

      {/* Sección 1: Información básica */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={14} /> Información básica
        </h3>
        <div className="space-y-4">
          <Input label="Nombre del servicio" icon={Tag}
            placeholder="Ej: Tour por el centro histórico"
            value={form.nombre} onChange={(e) => update('nombre', e.target.value)}
            error={errors.nombre} />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Descripción
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400
                resize-none"
              rows={3}
              placeholder="Describe tu servicio en detalle..."
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
            />
            {errors.descripcion && (
              <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>
            )}
          </div>

          <Input label="Lugar" icon={MapPin}
            placeholder="Ej: Plaza Mayor, Lima"
            value={form.lugar} onChange={(e) => update('lugar', e.target.value)}
            error={errors.lugar} />

          <Input label="Contacto de referencia" icon={Phone}
            placeholder="Nombre o teléfono de contacto"
            value={form.contacto_referencia}
            onChange={(e) => update('contacto_referencia', e.target.value)}
            error={errors.contacto_referencia} />
        </div>
      </div>

      {/* Sección 2: Horario y capacidad */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock size={14} /> Horario y capacidad
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Hora inicio" icon={Clock} placeholder="08:00:00"
            value={form.hora_inicio}
            onChange={(e) => update('hora_inicio', e.target.value)} />
          <Input label="Hora fin" icon={Clock} placeholder="18:00:00"
            value={form.hora_fin}
            onChange={(e) => update('hora_fin', e.target.value)} />
          <Input label="Capacidad máx." icon={Users} placeholder="20"
            type="number" value={form.capacidad_maxima}
            onChange={(e) => update('capacidad_maxima', e.target.value)}
            error={errors.capacidad_maxima} />
        </div>
      </div>

      {/* Sección 3: Precios */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign size={14} /> Precios
        </h3>
        <div className="space-y-4">
          <Input label="Precio regular (S/)" icon={DollarSign}
            type="number" step="0.01" placeholder="0.00"
            value={form.costo_regular}
            onChange={(e) => update('costo_regular', e.target.value)}
            error={errors.costo_regular} />

          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                ¿Tiene precio promocional?
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Activa para ofrecer un descuento especial
              </p>
            </div>
            <button
              type="button"
              onClick={() => update('tiene_promocion', !form.tiene_promocion)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.tiene_promocion ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.tiene_promocion ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {form.tiene_promocion && (
            <Input
              label="Precio promocional (S/) — debe ser menor al regular"
              icon={Tag}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.costo_promocional}
              onChange={(e) => update('costo_promocional', e.target.value)}
              error={errors.costo_promocional}
            />
          )}
        </div>
      </div>

      <Button
        type="submit"
        loading={loading}
        variant="purple"
        size="lg"
        className="w-full"
      >
        {submitLabel}
      </Button>
    </form>
  );
}