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

const PURPLE = '#8B5CF6';

export default function EntidadCrearServicio({ navigation }) {
  const { createServicio } = useEntidadStore();
  const [form, setForm] = useState({
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
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es requerida';
    if (!form.capacidad_maxima) e.capacidad_maxima = 'La capacidad es requerida';
    if (isNaN(Number(form.capacidad_maxima)) || Number(form.capacidad_maxima) <= 0)
      e.capacidad_maxima = 'Ingresa un número válido';
    if (!form.costo_regular) e.costo_regular = 'El costo es requerido';
    if (isNaN(Number(form.costo_regular)) || Number(form.costo_regular) <= 0)
      e.costo_regular = 'Ingresa un monto válido';
    if (form.tiene_promocion) {
      if (!form.costo_promocional)
        e.costo_promocional = 'Ingresa el costo promocional';
      if (
        Number(form.costo_promocional) >= Number(form.costo_regular)
      )
        e.costo_promocional = 'Debe ser menor al precio regular';
    }
    if (!form.lugar.trim()) e.lugar = 'El lugar es requerido';
    if (!form.contacto_referencia.trim())
      e.contacto_referencia = 'El contacto es requerido';
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
        costo_promocional: form.tiene_promocion
          ? Number(form.costo_promocional)
          : null,
      });
      Alert.alert('✅ Servicio creado', 'Tu servicio ya aparece en el catálogo', [
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
        <SectionHeader icon="information-circle-outline" label="Información básica" color={PURPLE} />

        <Input label="Nombre del servicio" placeholder="Ej: Tour por el centro histórico"
          value={form.nombre} onChangeText={(v) => update('nombre', v)}
          leftIcon="briefcase-outline" error={errors.nombre} autoCapitalize="sentences" />

        <Input label="Descripción" placeholder="Describe tu servicio en detalle"
          value={form.descripcion} onChangeText={(v) => update('descripcion', v)}
          leftIcon="document-text-outline" error={errors.descripcion}
          autoCapitalize="sentences" />

        <Input label="Lugar" placeholder="Ej: Plaza Mayor, Lima"
          value={form.lugar} onChangeText={(v) => update('lugar', v)}
          leftIcon="location-outline" error={errors.lugar} autoCapitalize="words" />

        <Input label="Contacto de referencia" placeholder="Nombre o teléfono de contacto"
          value={form.contacto_referencia}
          onChangeText={(v) => update('contacto_referencia', v)}
          leftIcon="call-outline" error={errors.contacto_referencia} />

        <SectionHeader icon="time-outline" label="Horario y capacidad" color={colors.primary} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input label="Hora inicio" placeholder="08:00:00"
              value={form.hora_inicio} onChangeText={(v) => update('hora_inicio', v)}
              leftIcon="play-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Hora fin" placeholder="18:00:00"
              value={form.hora_fin} onChangeText={(v) => update('hora_fin', v)}
              leftIcon="stop-outline" />
          </View>
        </View>

        <Input label="Capacidad máxima" placeholder="Ej: 20"
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
              <Text style={styles.promoTitle}>¿Tiene precio promocional?</Text>
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
  row: { flexDirection: 'row', gap: spacing.sm },
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