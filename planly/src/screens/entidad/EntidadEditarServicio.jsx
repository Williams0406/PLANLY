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

export default function EntidadEditarServicio({ navigation, route }) {
  const { servicio } = route.params;
  const { updateServicio } = useEntidadStore();

  const [form, setForm] = useState({
    nombre: servicio.nombre || '',
    descripcion: servicio.descripcion || '',
    hora_inicio: servicio.hora_inicio || '08:00:00',
    hora_fin: servicio.hora_fin || '18:00:00',
    capacidad_maxima: String(servicio.capacidad_maxima || ''),
    costo_regular: String(servicio.costo_regular || ''),
    tiene_promocion: servicio.tiene_promocion || false,
    costo_promocional: String(servicio.costo_promocional || ''),
    lugar: servicio.lugar || '',
    contacto_referencia: servicio.contacto_referencia || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.costo_regular) e.costo_regular = 'El costo es requerido';
    if (!form.lugar.trim()) e.lugar = 'El lugar es requerido';
    if (form.tiene_promocion && !form.costo_promocional)
      e.costo_promocional = 'Ingresa el costo promocional';
    if (
      form.tiene_promocion &&
      Number(form.costo_promocional) >= Number(form.costo_regular)
    )
      e.costo_promocional = 'Debe ser menor al precio regular';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateServicio(servicio.id, {
        ...form,
        capacidad_maxima: Number(form.capacidad_maxima),
        costo_regular: Number(form.costo_regular),
        costo_promocional: form.tiene_promocion
          ? Number(form.costo_promocional)
          : null,
      });
      Alert.alert('✅ Actualizado', 'Servicio actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'Error al actualizar';
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
        <Text style={styles.headerTitle}>Editar Servicio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input label="Nombre" placeholder="Nombre del servicio"
          value={form.nombre} onChangeText={(v) => update('nombre', v)}
          leftIcon="briefcase-outline" error={errors.nombre} />

        <Input label="Descripción" placeholder="Descripción del servicio"
          value={form.descripcion} onChangeText={(v) => update('descripcion', v)}
          leftIcon="document-text-outline" />

        <Input label="Lugar" placeholder="Lugar del servicio"
          value={form.lugar} onChangeText={(v) => update('lugar', v)}
          leftIcon="location-outline" error={errors.lugar} />

        <Input label="Contacto" placeholder="Contacto de referencia"
          value={form.contacto_referencia}
          onChangeText={(v) => update('contacto_referencia', v)}
          leftIcon="call-outline" />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input label="Hora inicio" value={form.hora_inicio}
              onChangeText={(v) => update('hora_inicio', v)} leftIcon="play-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Hora fin" value={form.hora_fin}
              onChangeText={(v) => update('hora_fin', v)} leftIcon="stop-outline" />
          </View>
        </View>

        <Input label="Capacidad máxima" value={form.capacidad_maxima}
          onChangeText={(v) => update('capacidad_maxima', v)}
          leftIcon="people-outline" keyboardType="numeric" />

        <Input label="Costo regular (S/)" value={form.costo_regular}
          onChangeText={(v) => update('costo_regular', v)}
          leftIcon="cash-outline" keyboardType="decimal-pad"
          error={errors.costo_regular} />

        <View style={styles.promoToggle}>
          <View style={styles.promoLeft}>
            <Ionicons name="pricetag-outline" size={18} color={colors.warning} />
            <Text style={styles.promoTitle}>Precio promocional</Text>
          </View>
          <Switch
            value={form.tiene_promocion}
            onValueChange={(v) => update('tiene_promocion', v)}
            trackColor={{ false: colors.border, true: colors.warning + '50' }}
            thumbColor={form.tiene_promocion ? colors.warning : '#f4f3f4'}
          />
        </View>

        {form.tiene_promocion && (
          <Input label="Costo promocional (S/)" value={form.costo_promocional}
            onChangeText={(v) => update('costo_promocional', v)}
            leftIcon="pricetag-outline" keyboardType="decimal-pad"
            error={errors.costo_promocional} />
        )}

        <Button
          title="Guardar cambios"
          onPress={handleUpdate}
          loading={loading}
          style={{ backgroundColor: PURPLE, marginTop: spacing.md }}
        />
      </ScrollView>
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
  promoToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FEF9C3', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promoTitle: { fontSize: 14, fontWeight: '600', color: '#854D0E' },
});