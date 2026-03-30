import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEntidadStore } from '../../store/entidad.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { colors, spacing, radius } from '../../theme';
import { toISOFromInput } from '../../utils/datetime';

const PURPLE = '#8B5CF6';
const EMPTY_HORARIO = { fecha_inicio: '', fecha_fin: '' };
const PAYMENT_OPTIONS = [
  { value: 'reserva', label: 'Reserva' },
  { value: 'pago_completo', label: 'Pago completo' },
  { value: 'contraentrega', label: 'Contraentrega' },
  { value: 'reserva_previo_saldo', label: 'Reserva + pago previo + saldo final' },
  { value: 'reserva_total_previo', label: 'Reserva + pago total antes del servicio' },
  { value: 'otra', label: 'Otra forma de pago' },
];

export default function EntidadCrearServicio({ navigation }) {
  const { createServicio } = useEntidadStore();
  const [form, setForm] = useState({
    categoria: 'General',
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
    imagenes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const updateHorario = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      horarios: prev.horarios.map((horario, idx) =>
        idx === index ? { ...horario, [key]: value } : horario
      ),
    }));
  const addHorario = () =>
    setForm((prev) => ({ ...prev, horarios: [...prev.horarios, { ...EMPTY_HORARIO }] }));
  const removeHorario = (index) =>
    setForm((prev) => ({
      ...prev,
      horarios: prev.horarios.filter((_, idx) => idx !== index),
    }));

  const validate = () => {
    const e = {};
    const horariosValidos = form.horarios.filter((item) => item.fecha_inicio || item.fecha_fin);
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.descripcion.trim()) e.descripcion = 'La descripcion es requerida';
    if (!form.capacidad_maxima) e.capacidad_maxima = 'La capacidad es requerida';
    if (isNaN(Number(form.capacidad_maxima)) || Number(form.capacidad_maxima) <= 0)
      e.capacidad_maxima = 'Ingresa un numero valido';
    if (!form.costo_regular) e.costo_regular = 'El costo es requerido';
    if (isNaN(Number(form.costo_regular)) || Number(form.costo_regular) <= 0)
      e.costo_regular = 'Ingresa un monto valido';
    if (form.tiene_promocion) {
      if (!form.costo_promocional) e.costo_promocional = 'Ingresa el costo promocional';
      if (Number(form.costo_promocional) >= Number(form.costo_regular)) {
        e.costo_promocional = 'Debe ser menor al precio regular';
      }
    }
    if (!form.lugar.trim()) e.lugar = 'El lugar es requerido';
    if (!form.contacto_referencia.trim()) e.contacto_referencia = 'El contacto es requerido';
    const reserva = Number(form.porcentaje_reserva);
    const previo = Number(form.porcentaje_pago_previo);
    if (form.modalidad_pago === 'reserva') {
      if (!form.porcentaje_reserva) e.porcentaje_reserva = 'Indica el porcentaje de reserva';
      else if (reserva <= 0 || reserva >= 100) e.porcentaje_reserva = 'Debe ser mayor a 0 y menor a 100';
    }
    if (form.modalidad_pago === 'reserva_previo_saldo') {
      if (!form.porcentaje_reserva) e.porcentaje_reserva = 'Indica el adelanto por reserva';
      if (!form.porcentaje_pago_previo) e.porcentaje_pago_previo = 'Indica el pago antes del servicio';
      if (!form.dias_antes_pago_previo) e.dias_antes_pago_previo = 'Indica los dias previos';
      if (form.porcentaje_reserva && form.porcentaje_pago_previo && reserva + previo >= 100) {
        e.porcentaje_pago_previo = 'La suma debe ser menor a 100 para dejar saldo final';
      }
    }
    if (form.modalidad_pago === 'reserva_total_previo') {
      if (!form.porcentaje_reserva) e.porcentaje_reserva = 'Indica el adelanto por reserva';
      if (!form.porcentaje_pago_previo) e.porcentaje_pago_previo = 'Indica el pago restante';
      if (!form.dias_antes_pago_previo) e.dias_antes_pago_previo = 'Indica los dias previos';
      if (form.porcentaje_reserva && form.porcentaje_pago_previo && reserva + previo !== 100) {
        e.porcentaje_pago_previo = 'La suma debe ser exactamente 100';
      }
    }
    if (form.modalidad_pago === 'otra' && !form.descripcion_forma_pago.trim()) {
      e.descripcion_forma_pago = 'Describe la forma de pago';
    }
    if (horariosValidos.length === 0) {
      e.horarios = 'Agrega al menos un horario';
    } else if (
      horariosValidos.some(
        (item) =>
          !toISOFromInput(item.fecha_inicio) ||
          !toISOFromInput(item.fecha_fin) ||
          new Date(toISOFromInput(item.fecha_inicio)) >= new Date(toISOFromInput(item.fecha_fin))
      )
    ) {
      e.horarios = 'Cada horario debe tener fecha de inicio y fin validas';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createServicio({
        ...form,
        capacidad_maxima: Number(form.capacidad_maxima),
        costo_regular: Number(form.costo_regular),
        costo_promocional: form.tiene_promocion ? Number(form.costo_promocional) : null,
        porcentaje_reserva: form.porcentaje_reserva ? Number(form.porcentaje_reserva) : null,
        porcentaje_pago_previo: form.porcentaje_pago_previo ? Number(form.porcentaje_pago_previo) : null,
        dias_antes_pago_previo: form.dias_antes_pago_previo ? Number(form.dias_antes_pago_previo) : null,
        descripcion_forma_pago: form.descripcion_forma_pago.trim(),
        imagenes: form.imagenes.split(',').map((item) => item.trim()).filter(Boolean),
        horarios: form.horarios
          .filter((item) => item.fecha_inicio && item.fecha_fin)
          .map((item) => ({
            fecha_inicio: toISOFromInput(item.fecha_inicio),
            fecha_fin: toISOFromInput(item.fecha_fin),
          })),
      });
      Alert.alert('Servicio creado', 'Tu servicio ya aparece en el catalogo', [
        { text: 'Ver servicios', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'Error al crear servicio';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Servicio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader icon="information-circle-outline" label="Informacion basica" color={PURPLE} />

        <Input label="Categoria" placeholder="Ej: Gastronomia"
          value={form.categoria} onChangeText={(v) => update('categoria', v)}
          leftIcon="pricetags-outline" />

        <Input label="Nombre del servicio" placeholder="Ej: Tour por el centro historico"
          value={form.nombre} onChangeText={(v) => update('nombre', v)}
          leftIcon="briefcase-outline" error={errors.nombre} autoCapitalize="sentences" />

        <Input label="Descripcion" placeholder="Describe tu servicio en detalle"
          value={form.descripcion} onChangeText={(v) => update('descripcion', v)}
          leftIcon="document-text-outline" error={errors.descripcion}
          autoCapitalize="sentences" />

        <Input label="Lugar" placeholder="Ej: Plaza Mayor, Lima"
          value={form.lugar} onChangeText={(v) => update('lugar', v)}
          leftIcon="location-outline" error={errors.lugar} autoCapitalize="words" />

        <Input label="Contacto de referencia" placeholder="Nombre o telefono de contacto"
          value={form.contacto_referencia}
          onChangeText={(v) => update('contacto_referencia', v)}
          leftIcon="call-outline" error={errors.contacto_referencia} />

        <Input label="Imagenes del servicio" placeholder="https://... , https://..."
          value={form.imagenes} onChangeText={(v) => update('imagenes', v)}
          leftIcon="images-outline" />

        <SectionHeader icon="time-outline" label="Horarios y capacidad" color={colors.primary} />

        {form.horarios.map((horario, index) => (
          <View key={`horario-${index}`} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>Horario {index + 1}</Text>
              {form.horarios.length > 1 && (
                <TouchableOpacity onPress={() => removeHorario(index)}>
                  <Text style={styles.removeText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
            <Input label="Fecha inicio" placeholder="21/03/2026 08:00"
              value={horario.fecha_inicio}
              onChangeText={(v) => updateHorario(index, 'fecha_inicio', v)}
              leftIcon="play-outline" />
            <Input label="Fecha fin" placeholder="21/03/2026 10:00"
              value={horario.fecha_fin}
              onChangeText={(v) => updateHorario(index, 'fecha_fin', v)}
              leftIcon="stop-outline" />
          </View>
        ))}

        {errors.horarios ? <Text style={styles.errorText}>{errors.horarios}</Text> : null}

        <TouchableOpacity style={styles.addScheduleBtn} onPress={addHorario}>
          <Ionicons name="add-circle-outline" size={18} color={PURPLE} />
          <Text style={styles.addScheduleText}>Agregar otro horario</Text>
        </TouchableOpacity>

        <Input label="Capacidad maxima" placeholder="Ej: 20"
          value={form.capacidad_maxima}
          onChangeText={(v) => update('capacidad_maxima', v)}
          leftIcon="people-outline" keyboardType="numeric"
          error={errors.capacidad_maxima} />

        <SectionHeader icon="cash-outline" label="Precios" color={colors.success} />

        <Input label="Costo regular (S/)" placeholder="0.00"
          value={form.costo_regular} onChangeText={(v) => update('costo_regular', v)}
          leftIcon="cash-outline" keyboardType="decimal-pad"
          error={errors.costo_regular} />

        <View style={styles.promoToggle}>
          <View style={styles.promoLeft}>
            <Ionicons name="pricetag-outline" size={18} color={colors.warning} />
            <View>
              <Text style={styles.promoTitle}>Tiene precio promocional?</Text>
              <Text style={styles.promoSubtitle}>Activa para ofrecer descuento</Text>
            </View>
          </View>
          <Switch
            value={form.tiene_promocion}
            onValueChange={(v) => update('tiene_promocion', v)}
            trackColor={{ false: colors.border, true: colors.warning + '50' }}
            thumbColor={form.tiene_promocion ? colors.warning : '#f4f3f4'}
          />
        </View>

        {form.tiene_promocion && (
          <Input label="Costo promocional (S/)" placeholder="0.00 (menor al regular)"
            value={form.costo_promocional}
            onChangeText={(v) => update('costo_promocional', v)}
            leftIcon="pricetag-outline" keyboardType="decimal-pad"
            error={errors.costo_promocional} />
        )}

        <SectionHeader icon="wallet-outline" label="Forma de pago" color="#0F766E" />

        <View style={styles.paymentOptions}>
          {PAYMENT_OPTIONS.map((option) => {
            const selected = form.modalidad_pago === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.paymentOption, selected && styles.paymentOptionActive]}
                onPress={() => update('modalidad_pago', option.value)}
              >
                <Text style={[styles.paymentOptionText, selected && styles.paymentOptionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(form.modalidad_pago === 'reserva' ||
          form.modalidad_pago === 'reserva_previo_saldo' ||
          form.modalidad_pago === 'reserva_total_previo') && (
          <Input label="Porcentaje de reserva (%)" placeholder="Ej: 30"
            value={form.porcentaje_reserva}
            onChangeText={(v) => update('porcentaje_reserva', v)}
            leftIcon="wallet-outline" keyboardType="decimal-pad"
            error={errors.porcentaje_reserva} />
        )}

        {(form.modalidad_pago === 'reserva_previo_saldo' ||
          form.modalidad_pago === 'reserva_total_previo') && (
          <>
            <Input label="Porcentaje a cobrar antes del servicio (%)" placeholder="Ej: 40"
              value={form.porcentaje_pago_previo}
              onChangeText={(v) => update('porcentaje_pago_previo', v)}
              leftIcon="calendar-outline" keyboardType="decimal-pad"
              error={errors.porcentaje_pago_previo} />
            <Input label="Dias antes del servicio" placeholder="Ej: 5"
              value={form.dias_antes_pago_previo}
              onChangeText={(v) => update('dias_antes_pago_previo', v)}
              leftIcon="time-outline" keyboardType="numeric"
              error={errors.dias_antes_pago_previo} />
          </>
        )}

        {(form.modalidad_pago === 'otra' || form.modalidad_pago === 'reserva') && (
          <Input label="Detalle de forma de pago" placeholder="Ej: saldo al ingresar al evento"
            value={form.descripcion_forma_pago}
            onChangeText={(v) => update('descripcion_forma_pago', v)}
            leftIcon="document-text-outline"
            error={errors.descripcion_forma_pago} />
        )}

        <Button
          title="Publicar servicio"
          onPress={handleCreate}
          loading={loading}
          style={[styles.btnCreate, { backgroundColor: PURPLE }]}
        />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ icon, label, color }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  scheduleCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  scheduleTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  removeText: { fontSize: 12, fontWeight: '600', color: colors.error },
  addScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  addScheduleText: { color: PURPLE, fontWeight: '600' },
  errorText: { fontSize: 12, color: colors.error, marginBottom: spacing.sm },
  paymentOptions: { gap: spacing.sm, marginBottom: spacing.md },
  paymentOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  paymentOptionActive: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  paymentOptionText: { fontSize: 13, fontWeight: '600', color: colors.text },
  paymentOptionTextActive: { color: '#115E59' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: spacing.sm, marginTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700' },
  promoToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FEF9C3', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promoTitle: { fontSize: 14, fontWeight: '600', color: '#854D0E' },
  promoSubtitle: { fontSize: 12, color: '#A16207' },
  btnCreate: { marginTop: spacing.md },
});
