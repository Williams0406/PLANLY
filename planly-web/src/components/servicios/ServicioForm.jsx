'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CircleDollarSign,
  FileText,
  Layers3,
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
import { serviciosService } from '@/services/servicios.service';

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
  categoria: '',
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
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await serviciosService.getCategorias();
        setCategories(data.results || data);
        setCategoriesError('');
      } catch {
        setCategoriesError('No pudimos cargar las categorias disponibles.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const availableCategories = useMemo(() => {
    const items = [...categories];
    if (form.categoria && !items.some((item) => item.nombre === form.categoria)) {
      items.unshift({
        id: 'actual',
        nombre: form.categoria,
        descripcion: 'Categoria actualmente asignada a este servicio.',
      });
    }
    return items;
  }, [categories, form.categoria]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateHorario = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      horarios: prev.horarios.map((horario, itemIndex) =>
        itemIndex === index ? { ...horario, [key]: value } : horario
      ),
    }));
  const addHorario = () =>
    setForm((prev) => ({ ...prev, horarios: [...prev.horarios, { ...EMPTY_HORARIO }] }));
  const removeHorario = (index) =>
    setForm((prev) => ({ ...prev, horarios: prev.horarios.filter((_, itemIndex) => itemIndex !== index) }));

  const validate = () => {
    const nextErrors = {};
    const horariosValidos = form.horarios.filter((item) => item.fecha_inicio || item.fecha_fin);

    if (!form.categoria.trim()) nextErrors.categoria = 'Selecciona una categoria';
    if (!form.nombre.trim()) nextErrors.nombre = 'Requerido';
    if (!form.descripcion.trim()) nextErrors.descripcion = 'Requerido';
    if (!form.lugar.trim()) nextErrors.lugar = 'Requerido';
    if (!form.contacto_referencia.trim()) nextErrors.contacto_referencia = 'Requerido';
    if (!form.capacidad_maxima || Number(form.capacidad_maxima) <= 0) nextErrors.capacidad_maxima = 'Debe ser mayor a 0';
    if (!form.costo_regular || Number(form.costo_regular) <= 0) nextErrors.costo_regular = 'Debe ser mayor a 0';
    if (form.tiene_promocion) {
      if (!form.costo_promocional) nextErrors.costo_promocional = 'Requerido';
      if (Number(form.costo_promocional) >= Number(form.costo_regular)) {
        nextErrors.costo_promocional = 'Debe ser menor al precio regular';
      }
    }

    const reserva = Number(form.porcentaje_reserva);
    const previo = Number(form.porcentaje_pago_previo);

    if (form.modalidad_pago === 'reserva') {
      if (!form.porcentaje_reserva) nextErrors.porcentaje_reserva = 'Indica el porcentaje de reserva';
      else if (reserva <= 0 || reserva >= 100) nextErrors.porcentaje_reserva = 'Debe ser mayor a 0 y menor a 100';
    }

    if (form.modalidad_pago === 'reserva_previo_saldo') {
      if (!form.porcentaje_reserva) nextErrors.porcentaje_reserva = 'Indica el adelanto de reserva';
      if (!form.porcentaje_pago_previo) nextErrors.porcentaje_pago_previo = 'Indica el pago previo';
      if (!form.dias_antes_pago_previo) nextErrors.dias_antes_pago_previo = 'Indica los dias previos';
      if (form.porcentaje_reserva && form.porcentaje_pago_previo && reserva + previo >= 100) {
        nextErrors.porcentaje_pago_previo = 'La suma debe ser menor a 100 para dejar saldo final';
      }
    }

    if (form.modalidad_pago === 'reserva_total_previo') {
      if (!form.porcentaje_reserva) nextErrors.porcentaje_reserva = 'Indica el adelanto de reserva';
      if (!form.porcentaje_pago_previo) nextErrors.porcentaje_pago_previo = 'Indica el pago restante';
      if (!form.dias_antes_pago_previo) nextErrors.dias_antes_pago_previo = 'Indica los dias previos';
      if (form.porcentaje_reserva && form.porcentaje_pago_previo && reserva + previo !== 100) {
        nextErrors.porcentaje_pago_previo = 'La suma debe ser exactamente 100';
      }
    }

    if (form.modalidad_pago === 'otra' && !form.descripcion_forma_pago.trim()) {
      nextErrors.descripcion_forma_pago = 'Describe la forma de pago';
    }

    if (horariosValidos.length === 0) {
      nextErrors.horarios = 'Agrega al menos un horario';
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
      nextErrors.horarios = 'Cada horario debe tener inicio y fin validos';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGlobalError('');
    if (!validate()) return;

    try {
      await onSubmit({
        ...form,
        categoria: form.categoria.trim(),
        capacidad_maxima: Number(form.capacidad_maxima),
        costo_regular: Number(form.costo_regular),
        costo_promocional: form.tiene_promocion ? Number(form.costo_promocional) : null,
        porcentaje_reserva: form.porcentaje_reserva ? Number(form.porcentaje_reserva) : null,
        porcentaje_pago_previo: form.porcentaje_pago_previo ? Number(form.porcentaje_pago_previo) : null,
        dias_antes_pago_previo: form.dias_antes_pago_previo ? Number(form.dias_antes_pago_previo) : null,
        descripcion_forma_pago: form.descripcion_forma_pago.trim(),
        horarios: form.horarios.filter((item) => item.fecha_inicio && item.fecha_fin),
      });
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
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
      {categoriesError ? <Alert message={categoriesError} variant="warning" /> : null}

      <SectionCard
        icon={FileText}
        title="Informacion base"
        description="Empieza por la categoria, el nombre, la propuesta del servicio y el punto de referencia."
      >
        <div className="grid gap-4">
          <SelectField
            label="Categoria"
            icon={Layers3}
            value={form.categoria}
            onChange={(event) => update('categoria', event.target.value)}
            error={errors.categoria}
            disabled={categoriesLoading || (!availableCategories.length && !form.categoria)}
          >
            <option value="">
              {categoriesLoading ? 'Cargando categorias...' : 'Selecciona una categoria'}
            </option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.nombre}>
                {category.nombre}
              </option>
            ))}
          </SelectField>

          <Input
            label="Nombre del servicio"
            icon={Tag}
            placeholder="Ej. Tour gastronomico por Barranco"
            value={form.nombre}
            onChange={(event) => update('nombre', event.target.value)}
            error={errors.nombre}
          />

          <TextareaField
            label="Descripcion"
            placeholder="Explica que vive la persona, que incluye, que hace especial al servicio y por que vale la pena."
            value={form.descripcion}
            onChange={(event) => update('descripcion', event.target.value)}
            error={errors.descripcion}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Lugar"
              icon={MapPin}
              placeholder="Ej. Plaza Mayor, Lima"
              value={form.lugar}
              onChange={(event) => update('lugar', event.target.value)}
              error={errors.lugar}
            />
            <Input
              label="Contacto de referencia"
              icon={Phone}
              placeholder="Nombre, WhatsApp o telefono"
              value={form.contacto_referencia}
              onChange={(event) => update('contacto_referencia', event.target.value)}
              error={errors.contacto_referencia}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={CalendarClock}
        title="Horarios y capacidad"
        description="Haz que la disponibilidad sea clara. Mientras menos dudas, mas facil sera reservar."
      >
        <div className="space-y-4">
          {form.horarios.map((horario, index) => (
            <div key={`horario-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Horario {index + 1}</p>
                  <p className="text-xs text-slate-500">Define con precision el inicio y fin de esta ventana.</p>
                </div>
                {form.horarios.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeHorario(index)}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Fecha inicio"
                  icon={CalendarClock}
                  type="datetime-local"
                  value={horario.fecha_inicio}
                  onChange={(event) => updateHorario(index, 'fecha_inicio', event.target.value)}
                />
                <Input
                  label="Fecha fin"
                  icon={CalendarClock}
                  type="datetime-local"
                  value={horario.fecha_fin}
                  onChange={(event) => updateHorario(index, 'fecha_fin', event.target.value)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addHorario}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
          >
            <Plus className="h-4 w-4" />
            Agregar otro horario
          </button>
          {errors.horarios ? <p className="text-sm text-red-500">{errors.horarios}</p> : null}

          <Input
            label="Capacidad maxima"
            icon={Users}
            type="number"
            placeholder="20"
            value={form.capacidad_maxima}
            onChange={(event) => update('capacidad_maxima', event.target.value)}
            error={errors.capacidad_maxima}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={CircleDollarSign}
        title="Precios y promocion"
        description="Presenta un precio claro y usa promociones solo cuando realmente ayuden a convertir."
      >
        <div className="space-y-5">
          <Input
            label="Precio regular (S/)"
            icon={CircleDollarSign}
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.costo_regular}
            onChange={(event) => update('costo_regular', event.target.value)}
            error={errors.costo_regular}
          />

          <div className="flex items-center justify-between rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Activar precio promocional</p>
              <p className="mt-1 text-xs leading-5 text-amber-700">
                Usalo cuando quieras resaltar una campana, una temporada o una oferta limitada.
              </p>
            </div>
            <button
              type="button"
              onClick={() => update('tiene_promocion', !form.tiene_promocion)}
              className={`relative h-7 w-14 rounded-full transition-colors ${
                form.tiene_promocion ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.tiene_promocion ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>

          {form.tiene_promocion ? (
            <Input
              label="Precio promocional (S/)"
              icon={Tag}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.costo_promocional}
              onChange={(event) => update('costo_promocional', event.target.value)}
              error={errors.costo_promocional}
            />
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        icon={WalletCards}
        title="Forma de pago"
        description="Haz visible como se cobra para que el cliente entienda la dinamica antes de reservar."
      >
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
                  <p className={`mt-1 text-xs leading-5 ${selected ? 'text-cyan-700' : 'text-slate-500'}`}>
                    {option.hint}
                  </p>
                </button>
              );
            })}
          </div>

          {(form.modalidad_pago === 'reserva' ||
            form.modalidad_pago === 'reserva_previo_saldo' ||
            form.modalidad_pago === 'reserva_total_previo') ? (
            <Input
              label="Porcentaje de reserva (%)"
              icon={CircleDollarSign}
              type="number"
              step="0.01"
              placeholder="30"
              value={form.porcentaje_reserva}
              onChange={(event) => update('porcentaje_reserva', event.target.value)}
              error={errors.porcentaje_reserva}
            />
          ) : null}

          {(form.modalidad_pago === 'reserva_previo_saldo' ||
            form.modalidad_pago === 'reserva_total_previo') ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Pago previo (%)"
                icon={CircleDollarSign}
                type="number"
                step="0.01"
                placeholder="40"
                value={form.porcentaje_pago_previo}
                onChange={(event) => update('porcentaje_pago_previo', event.target.value)}
                error={errors.porcentaje_pago_previo}
              />
              <Input
                label="Dias antes del servicio"
                icon={CalendarClock}
                type="number"
                placeholder="5"
                value={form.dias_antes_pago_previo}
                onChange={(event) => update('dias_antes_pago_previo', event.target.value)}
                error={errors.dias_antes_pago_previo}
              />
            </div>
          ) : null}

          {(form.modalidad_pago === 'otra' || form.modalidad_pago === 'reserva') ? (
            <TextareaField
              label="Detalle de forma de pago"
              placeholder="Ej. El saldo restante se paga al iniciar la experiencia o 48 horas antes por transferencia."
              value={form.descripcion_forma_pago}
              onChange={(event) => update('descripcion_forma_pago', event.target.value)}
              error={errors.descripcion_forma_pago}
            />
          ) : null}
        </div>
      </SectionCard>

      <Button
        type="submit"
        loading={loading}
        variant="primary"
        size="lg"
        className="w-full rounded-2xl py-4"
        disabled={categoriesLoading || (!availableCategories.length && !form.categoria)}
      >
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
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function SelectField({ label, icon: Icon, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <label className="text-sm font-medium text-slate-700">{label}</label> : null}

      <div className="relative">
        {Icon ? (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        ) : null}

        <select
          className={`w-full appearance-none rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 ${
            Icon ? 'pl-12' : ''
          } ${
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-cyan-400 focus:ring-cyan-100'
          } ${className}`}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
