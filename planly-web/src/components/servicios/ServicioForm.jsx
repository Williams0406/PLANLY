'use client';

import { useState } from 'react';
import {
  CalendarClock,
  CircleDollarSign,
  FileText,
  MapPin,
  Phone,
  Plus,
  Tag,
  Users,
  WalletCards,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const EMPTY_HORARIO = { fecha_inicio: '', fecha_fin: '' };
const PAYMENT_OPTIONS = [
  { value: 'reserva', label: 'Reserva', hint: 'Bloquea la fecha con un adelanto inicial.' },
  { value: 'pago_completo', label: 'Pago completo', hint: 'Todo el monto se cobra en un solo paso.' },
  { value: 'contraentrega', label: 'Contraentrega', hint: 'Se paga al recibir o tomar el servicio.' },
  { value: 'reserva_previo_saldo', label: 'Reserva + previo + saldo', hint: 'Divide el cobro en tres momentos.' },
  { value: 'reserva_total_previo', label: 'Reserva + total anticipado', hint: 'Todo queda pagado antes del servicio.' },
  { value: 'otra', label: 'Otra forma', hint: 'Describe una regla personalizada de pago.' },
];

const INITIAL = {
  nombre: '',
  descripcion: '',
  horarios: [{ ...EMPTY_HORARIO }],
  capacidad_maxima: '',
  costo_regular: '',
  tiene_promocion: false,
  costo_promocional: '',
  modalidad_pago: 'pago_completo',
  porcentaje_reserva: '',
  porcentaje_pago_previo: '',
  dias_antes_pago_previo: '',
  descripcion_forma_pago: '',
  lugar: '',
  contacto_referencia: '',
};

const normalizeDateTime = (value) => (value ? String(value).replace('Z', '').slice(0, 16) : '');

export default function ServicioForm({ initial = {}, onSubmit, loading, submitLabel = 'Guardar' }) {
  const [form, setForm] = useState({
    ...INITIAL,
    ...initial,
    horarios: initial.horarios?.length
      ? initial.horarios.map((horario) => ({
          fecha_inicio: normalizeDateTime(horario.fecha_inicio),
          fecha_fin: normalizeDateTime(horario.fecha_fin),
        }))
      : [{ ...EMPTY_HORARIO }],
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const updateHorario = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      horarios: prev.horarios.map((horario, idx) => (idx === index ? { ...horario, [key]: value } : horario)),
    }));
  const addHorario = () => setForm((prev) => ({ ...prev, horarios: [...prev.horarios, { ...EMPTY_HORARIO }] }));
  const removeHorario = (index) =>
    setForm((prev) => ({ ...prev, horarios: prev.horarios.filter((_, idx) => idx !== index) }));

  const validate = () => {
    const e = {};
    const horariosValidos = form.horarios.filter((item) => item.fecha_inicio || item.fecha_fin);
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.descripcion.trim()) e.descripcion = 'Requerido';
    if (!form.lugar.trim()) e.lugar = 'Requerido';
    if (!form.contacto_referencia.trim()) e.contacto_referencia = 'Requerido';
    if (!form.capacidad_maxima || Number(form.capacidad_maxima) <= 0) e.capacidad_maxima = 'Debe ser mayor a 0';
    if (!form.costo_regular || Number(form.costo_regular) <= 0) e.costo_regular = 'Debe ser mayor a 0';
    if (form.tiene_promocion) {
      if (!form.costo_promocional) e.costo_promocional = 'Requerido';
      if (Number(form.costo_promocional) >= Number(form.costo_regular)) e.costo_promocional = 'Debe ser menor al precio regular';
    }
    const reserva = Number(form.porcentaje_reserva);
    const previo = Number(form.porcentaje_pago_previo);
    if (form.modalidad_pago === 'reserva') {
      if (!form.porcentaje_reserva) e.porcentaje_reserva = 'Indica el porcentaje de reserva';
      else if (reserva <= 0 || reserva >= 100) e.porcentaje_reserva = 'Debe ser mayor a 0 y menor a 100';
    }
    if (form.modalidad_pago === 'reserva_previo_saldo') {
      if (!form.porcentaje_reserva) e.porcentaje_reserva = 'Indica el adelanto de reserva';
      if (!form.porcentaje_pago_previo) e.porcentaje_pago_previo = 'Indica el pago previo';
      if (!form.dias_antes_pago_previo) e.dias_antes_pago_previo = 'Indica los días previos';
      if (form.porcentaje_reserva && form.porcentaje_pago_previo && reserva + previo >= 100) e.porcentaje_pago_previo = 'La suma debe ser menor a 100 para dejar saldo final';
    }
    if (form.modalidad_pago === 'reserva_total_previo') {
      if (!form.porcentaje_reserva) e.porcentaje_reserva = 'Indica el adelanto de reserva';
      if (!form.porcentaje_pago_previo) e.porcentaje_pago_previo = 'Indica el pago restante';
      if (!form.dias_antes_pago_previo) e.dias_antes_pago_previo = 'Indica los días previos';
      if (form.porcentaje_reserva && form.porcentaje_pago_previo && reserva + previo !== 100) e.porcentaje_pago_previo = 'La suma debe ser exactamente 100';
    }
    if (form.modalidad_pago === 'otra' && !form.descripcion_forma_pago.trim()) e.descripcion_forma_pago = 'Describe la forma de pago';
    if (horariosValidos.length === 0) {
      e.horarios = 'Agrega al menos un horario';
    } else if (
      horariosValidos.some(
        (item) =>
          !item.fecha_inicio ||
          !item.fecha_fin ||
          Number.isNaN(new Date(item.fecha_inicio).getTime()) ||
          Number.isNaN(new Date(item.fecha_fin).getTime()) ||
          new Date(item.fecha_inicio) >= new Date(item.fecha_fin)
      )
    ) {
      e.horarios = 'Cada horario debe tener inicio y fin válidos';
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
        costo_promocional: form.tiene_promocion ? Number(form.costo_promocional) : null,
        porcentaje_reserva: form.porcentaje_reserva ? Number(form.porcentaje_reserva) : null,
        porcentaje_pago_previo: form.porcentaje_pago_previo ? Number(form.porcentaje_pago_previo) : null,
        dias_antes_pago_previo: form.dias_antes_pago_previo ? Number(form.dias_antes_pago_previo) : null,
        descripcion_forma_pago: form.descripcion_forma_pago.trim(),
        horarios: form.horarios.filter((item) => item.fecha_inicio && item.fecha_fin),
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <Alert message={globalError} />

      <SectionCard icon={FileText} title="Información base" description="Empieza por el nombre, la propuesta del servicio y el punto de referencia.">
        <div className="grid gap-4">
          <Input label="Nombre del servicio" icon={Tag} placeholder="Ej. Tour gastronómico por Barranco" value={form.nombre} onChange={(e) => update('nombre', e.target.value)} error={errors.nombre} />

          <TextareaField
            label="Descripción"
            placeholder="Explica qué vive la persona, qué incluye, qué hace especial al servicio y por qué vale la pena."
            value={form.descripcion}
            onChange={(e) => update('descripcion', e.target.value)}
            error={errors.descripcion}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Lugar" icon={MapPin} placeholder="Ej. Plaza Mayor, Lima" value={form.lugar} onChange={(e) => update('lugar', e.target.value)} error={errors.lugar} />
            <Input label="Contacto de referencia" icon={Phone} placeholder="Nombre, WhatsApp o teléfono" value={form.contacto_referencia} onChange={(e) => update('contacto_referencia', e.target.value)} error={errors.contacto_referencia} />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={CalendarClock} title="Horarios y capacidad" description="Haz que la disponibilidad sea clara. Mientras menos dudas, más fácil será reservar.">
        <div className="space-y-4">
          {form.horarios.map((horario, index) => (
            <div key={`horario-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Horario {index + 1}</p>
                  <p className="text-xs text-slate-500">Define con precisión el inicio y fin de esta ventana.</p>
                </div>
                {form.horarios.length > 1 ? (
                  <button type="button" onClick={() => removeHorario(index)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                    Eliminar
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Fecha inicio" icon={CalendarClock} type="datetime-local" value={horario.fecha_inicio} onChange={(e) => updateHorario(index, 'fecha_inicio', e.target.value)} />
                <Input label="Fecha fin" icon={CalendarClock} type="datetime-local" value={horario.fecha_fin} onChange={(e) => updateHorario(index, 'fecha_fin', e.target.value)} />
              </div>
            </div>
          ))}

          <button type="button" onClick={addHorario} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100">
            <Plus className="h-4 w-4" />
            Agregar otro horario
          </button>
          {errors.horarios ? <p className="text-sm text-red-500">{errors.horarios}</p> : null}

          <Input label="Capacidad máxima" icon={Users} type="number" placeholder="20" value={form.capacidad_maxima} onChange={(e) => update('capacidad_maxima', e.target.value)} error={errors.capacidad_maxima} />
        </div>
      </SectionCard>

      <SectionCard icon={CircleDollarSign} title="Precios y promoción" description="Presenta un precio claro y usa promociones solo cuando realmente ayuden a convertir.">
        <div className="space-y-5">
          <Input label="Precio regular (S/)" icon={CircleDollarSign} type="number" step="0.01" placeholder="0.00" value={form.costo_regular} onChange={(e) => update('costo_regular', e.target.value)} error={errors.costo_regular} />

          <div className="flex items-center justify-between rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Activar precio promocional</p>
              <p className="mt-1 text-xs leading-5 text-amber-700">Úsalo cuando quieras resaltar una campaña, una temporada o una oferta limitada.</p>
            </div>
            <button
              type="button"
              onClick={() => update('tiene_promocion', !form.tiene_promocion)}
              className={`relative h-7 w-14 rounded-full transition-colors ${form.tiene_promocion ? 'bg-amber-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.tiene_promocion ? 'translate-x-7' : ''}`} />
            </button>
          </div>

          {form.tiene_promocion ? (
            <Input label="Precio promocional (S/)" icon={Tag} type="number" step="0.01" placeholder="0.00" value={form.costo_promocional} onChange={(e) => update('costo_promocional', e.target.value)} error={errors.costo_promocional} />
          ) : null}
        </div>
      </SectionCard>

      <SectionCard icon={WalletCards} title="Forma de pago" description="Haz visible cómo se cobra para que el cliente entienda la dinámica antes de reservar.">
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {PAYMENT_OPTIONS.map((option) => {
              const selected = form.modalidad_pago === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update('modalidad_pago', option.value)}
                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                    selected
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className={`mt-1 text-xs leading-5 ${selected ? 'text-cyan-700' : 'text-slate-500'}`}>{option.hint}</p>
                </button>
              );
            })}
          </div>

          {(form.modalidad_pago === 'reserva' || form.modalidad_pago === 'reserva_previo_saldo' || form.modalidad_pago === 'reserva_total_previo') ? (
            <Input label="Porcentaje de reserva (%)" icon={CircleDollarSign} type="number" step="0.01" placeholder="30" value={form.porcentaje_reserva} onChange={(e) => update('porcentaje_reserva', e.target.value)} error={errors.porcentaje_reserva} />
          ) : null}

          {(form.modalidad_pago === 'reserva_previo_saldo' || form.modalidad_pago === 'reserva_total_previo') ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Pago previo (%)" icon={CircleDollarSign} type="number" step="0.01" placeholder="40" value={form.porcentaje_pago_previo} onChange={(e) => update('porcentaje_pago_previo', e.target.value)} error={errors.porcentaje_pago_previo} />
              <Input label="Días antes del servicio" icon={CalendarClock} type="number" placeholder="5" value={form.dias_antes_pago_previo} onChange={(e) => update('dias_antes_pago_previo', e.target.value)} error={errors.dias_antes_pago_previo} />
            </div>
          ) : null}

          {(form.modalidad_pago === 'otra' || form.modalidad_pago === 'reserva') ? (
            <TextareaField
              label="Detalle de forma de pago"
              placeholder="Ej. El saldo restante se paga al iniciar la experiencia o 48 horas antes por transferencia."
              value={form.descripcion_forma_pago}
              onChange={(e) => update('descripcion_forma_pago', e.target.value)}
              error={errors.descripcion_forma_pago}
            />
          ) : null}
        </div>
      </SectionCard>

      <Button type="submit" loading={loading} variant="purple" size="lg" className="w-full rounded-2xl py-4">
        {submitLabel}
      </Button>
    </form>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-2xl bg-cyan-50 p-3">
          <Icon className="h-5 w-5 text-cyan-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TextareaField({ label, placeholder, value, onChange, error }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none"
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
