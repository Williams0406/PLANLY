import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';
import { useFinanceStore } from '../../store/finance.store';
import { financeApi } from '../../api/finance.api';

const TIPO_OPTIONS = [
  {
    value: 'gasto_grupal',
    label: 'Gasto compartido',
    helper: 'Ideal para registrar consumos del grupo y dividirlos mejor.',
    icon: 'people-outline',
    accent: '#06B6D4',
  },
  {
    value: 'gasto_individual',
    label: 'Gasto personal',
    helper: 'Lo pagas tú y no se divide entre los demás.',
    icon: 'person-outline',
    accent: '#F97316',
  },
  {
    value: 'prestamo',
    label: 'Préstamo',
    helper: 'Registra una deuda entre integrantes del plan.',
    icon: 'swap-horizontal-outline',
    accent: '#8B5CF6',
  },
  {
    value: 'pago_prestamo',
    label: 'Pago',
    helper: 'Marca un abono o pago pendiente de una deuda.',
    icon: 'cash-outline',
    accent: '#22C55E',
  },
];

export default function FinanceCreateMovementScreen({ navigation, route }) {
  const { plan } = route.params;
  const { addMovimiento } = useFinanceStore();
  const [saving, setSaving] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [loadingPrestamos, setLoadingPrestamos] = useState(false);
  const [loadingDeudas, setLoadingDeudas] = useState(false);
  const [serviciosPendientes, setServiciosPendientes] = useState([]);
  const [prestamoPlanes, setPrestamoPlanes] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_movimiento: 'gasto_grupal',
    servicio_pendiente_id: '',
    etapa_pago: '',
    deudor_id: '',
    prestamo_id: '',
  });

  const selectedType = useMemo(
    () => TIPO_OPTIONS.find((option) => option.value === form.tipo_movimiento) || TIPO_OPTIONS[0],
    [form.tipo_movimiento]
  );
  const isPagoDisabled = !loadingDeudas && deudas.length === 0;

  const selectedServicio = useMemo(
    () => serviciosPendientes.find((item) => String(item.asignacion_id) === String(form.servicio_pendiente_id)) || null,
    [form.servicio_pendiente_id, serviciosPendientes]
  );
  const paymentOptions = selectedServicio?.payment_options || [];
  const selectedPaymentOption = useMemo(
    () => paymentOptions.find((option) => option.tipo === form.etapa_pago) || null,
    [form.etapa_pago, paymentOptions]
  );

  const selectedPrestamoPlan = useMemo(
    () => prestamoPlanes.find((item) => String(item.id) === String(plan?.id)) || null,
    [plan?.id, prestamoPlanes]
  );
  const deudores = selectedPrestamoPlan?.deudores || [];
  const selectedDeudor = useMemo(
    () => deudores.find((item) => String(item.id) === String(form.deudor_id)) || null,
    [form.deudor_id, deudores]
  );

  const selectedDeuda = useMemo(
    () => deudas.find((item) => String(item.id) === String(form.prestamo_id)) || null,
    [form.prestamo_id, deudas]
  );

  const summary = useMemo(
    () => [
      { label: 'Plan', value: plan?.nombre || 'Plan', icon: 'albums-outline' },
      { label: 'Tipo', value: selectedType.label, icon: selectedType.icon },
      { label: 'Fecha', value: form.fecha, icon: 'calendar-outline' },
    ],
    [form.fecha, plan?.nombre, selectedType]
  );

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const loadServiciosPendientes = async () => {
      if (form.tipo_movimiento !== 'gasto_grupal') {
        setServiciosPendientes([]);
        return;
      }
      setLoadingServicios(true);
      try {
        const response = await financeApi.getServiciosPendientes(plan.id);
        setServiciosPendientes(response.data || []);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los servicios pendientes del plan.');
      } finally {
        setLoadingServicios(false);
      }
    };
    loadServiciosPendientes();
  }, [form.tipo_movimiento, plan.id]);

  useEffect(() => {
    const loadPrestamoContexto = async () => {
      if (form.tipo_movimiento !== 'prestamo') {
        setPrestamoPlanes([]);
        return;
      }
      setLoadingPrestamos(true);
      try {
        const response = await financeApi.getPrestamoContexto();
        setPrestamoPlanes(response.data || []);
      } catch {
        Alert.alert('Error', 'No se pudo cargar la información de planes y deudores.');
      } finally {
        setLoadingPrestamos(false);
      }
    };
    loadPrestamoContexto();
  }, [form.tipo_movimiento]);

  useEffect(() => {
    const loadDeudas = async () => {
      setLoadingDeudas(true);
      try {
        const response = await financeApi.getDeudas();
        setDeudas(response.data || []);
      } catch {
        if (form.tipo_movimiento === 'pago_prestamo') {
          Alert.alert('Error', 'No se pudieron cargar tus deudas pendientes.');
        }
      } finally {
        setLoadingDeudas(false);
      }
    };
    loadDeudas();
  }, [form.tipo_movimiento]);

  useEffect(() => {
    if (form.tipo_movimiento === 'pago_prestamo' && isPagoDisabled) {
      setForm((prev) => ({ ...prev, tipo_movimiento: 'gasto_grupal', prestamo_id: '' }));
    }
  }, [form.tipo_movimiento, isPagoDisabled]);

  useEffect(() => {
    if (!selectedServicio) return;
    const nextOption = paymentOptions[0] || null;
    if (nextOption) {
      setForm((prev) => ({
        ...prev,
        etapa_pago: nextOption.tipo,
        descripcion: nextOption.descripcion_sugerida,
        monto: String(nextOption.monto),
      }));
    }
  }, [selectedServicio, paymentOptions]);

  useEffect(() => {
    if (!selectedPaymentOption) return;
    setForm((prev) => ({
      ...prev,
      descripcion: selectedPaymentOption.descripcion_sugerida,
      monto: String(selectedPaymentOption.monto),
    }));
  }, [selectedPaymentOption]);

  useEffect(() => {
    if (form.tipo_movimiento !== 'prestamo') return;
    if (selectedPrestamoPlan?.deudores?.length) {
      setForm((prev) => ({
        ...prev,
        deudor_id:
          prev.deudor_id && selectedPrestamoPlan.deudores.some((item) => String(item.id) === String(prev.deudor_id))
            ? prev.deudor_id
            : String(selectedPrestamoPlan.deudores[0].id),
      }));
    } else {
      setForm((prev) => ({ ...prev, deudor_id: '' }));
    }
  }, [selectedPrestamoPlan, form.tipo_movimiento]);

  useEffect(() => {
    if (!selectedDeuda) return;
    setForm((prev) => ({
      ...prev,
      descripcion: `Pago a ${selectedDeuda.prestamista_username} del préstamo en ${selectedDeuda.grupo_nombre}`,
      monto: String(selectedDeuda.saldo_pendiente),
    }));
  }, [selectedDeuda]);

  const validate = () => {
    const nextErrors = {};
    if (!form.descripcion.trim()) nextErrors.descripcion = 'Cuéntanos qué pasó.';
    if (!form.monto) nextErrors.monto = 'Ingresa el monto.';
    if (Number.isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
      nextErrors.monto = 'Ingresa un monto válido.';
    }
    if (!form.fecha) nextErrors.fecha = 'Selecciona una fecha.';
    if (form.tipo_movimiento === 'gasto_grupal' && selectedServicio && paymentOptions.length > 1 && !form.etapa_pago) {
      nextErrors.etapa_pago = 'Selecciona si registrarás adelanto o restante.';
    }
    if (form.tipo_movimiento === 'prestamo') {
      if (!selectedPrestamoPlan) nextErrors.deudor_id = 'Este plan necesita un grupo para registrar préstamos.';
      if (!form.deudor_id) nextErrors.deudor_id = 'Selecciona un deudor.';
    }
    if (form.tipo_movimiento === 'pago_prestamo') {
      if (!form.prestamo_id) nextErrors.prestamo_id = 'Selecciona una deuda.';
      if (selectedDeuda && Number(form.monto) > Number(selectedDeuda.monto)) {
        nextErrors.monto = 'El monto no puede superar el monto original del préstamo.';
      }
      if (selectedDeuda && Number(form.monto) > Number(selectedDeuda.saldo_pendiente)) {
        nextErrors.monto = 'El monto no puede superar el saldo pendiente.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        descripcion: form.descripcion.trim(),
        monto: Number(form.monto),
        fecha: form.fecha,
        tipo_movimiento: form.tipo_movimiento,
      };

      if (form.tipo_movimiento === 'prestamo') {
        payload.plan_grupal = Number(plan.id);
        payload.grupo = selectedPrestamoPlan?.grupo_id;
        payload.deudor_id = Number(form.deudor_id);
      } else if (form.tipo_movimiento === 'pago_prestamo') {
        payload.prestamo_id = Number(form.prestamo_id);
      } else {
        payload.plan_grupal = plan.id;
        payload.grupo = typeof plan.grupo === 'object' ? plan.grupo.id : plan.grupo;
      }

      await addMovimiento(payload);
      Alert.alert('Movimiento guardado', 'El movimiento fue registrado correctamente.');
      navigation.replace('FinancePlanSummary', {
        plan:
          form.tipo_movimiento === 'prestamo'
            ? { ...plan, id: payload.plan_grupal, grupo: payload.grupo, nombre: selectedPrestamoPlan?.nombre || plan.nombre }
            : plan,
        refreshAt: Date.now(),
      });
    } catch (error) {
      const message = error?.response?.data
        ? Object.values(error.response.data).flat().join('\n')
        : 'No se pudo guardar el movimiento.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Ionicons name="wallet-outline" size={16} color="#67E8F9" />
            <Text style={styles.heroBadgeText}>Nuevo movimiento</Text>
          </View>

          <Text style={styles.headerTitle}>Registrar movimiento con más agilidad</Text>
          <Text style={styles.headerSubtitle}>Elige el tipo, completa lo mínimo y guarda en segundos.</Text>

          <View style={styles.summaryRow}>
            {summary.map((item) => (
              <View key={item.label} style={styles.summaryCard}>
                <Ionicons name={item.icon} size={16} color={colors.primary} />
                <Text style={styles.summaryValue} numberOfLines={1}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Tipo de movimiento</Text>
          <Text style={styles.sectionHint}>Empieza por la intención principal. El formulario se adapta solo.</Text>
          <View style={styles.typeGrid}>
            {TIPO_OPTIONS.map((option) => {
              const active = form.tipo_movimiento === option.value;
              const disabled = option.value === 'pago_prestamo' && isPagoDisabled;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeCard,
                    active && { borderColor: option.accent, backgroundColor: `${option.accent}14` },
                    disabled && styles.typeCardDisabled,
                  ]}
                  onPress={() => {
                    if (disabled) return;
                    update('tipo_movimiento', option.value);
                  }}
                  disabled={disabled}
                  activeOpacity={0.88}
                >
                  <View style={[styles.typeIcon, { backgroundColor: `${option.accent}18` }]}>
                    <Ionicons name={option.icon} size={18} color={option.accent} />
                  </View>
                  <Text style={[styles.typeTitle, active && { color: option.accent }]}>{option.label}</Text>
                  <Text style={styles.typeHelper}>
                    {disabled ? 'No tienes deudas pendientes registradas.' : option.helper}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {form.tipo_movimiento === 'gasto_grupal' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Servicio pendiente</Text>
            <Text style={styles.sectionHint}>Si eliges uno, el monto y la descripción se completan más rápido.</Text>

            {loadingServicios ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Cargando servicios asignados del plan...</Text>
              </View>
            ) : serviciosPendientes.length === 0 ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>No hay servicios pendientes o en interés vinculados a este plan.</Text>
              </View>
            ) : (
              <View style={styles.optionList}>
                {serviciosPendientes.map((item) => {
                  const active = String(item.asignacion_id) === String(form.servicio_pendiente_id);
                  return (
                    <TouchableOpacity
                      key={item.asignacion_id}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => update('servicio_pendiente_id', String(item.asignacion_id))}
                      activeOpacity={0.88}
                    >
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{item.servicio_nombre}</Text>
                      <Text style={styles.optionMeta}>Actividad: {item.actividad_titulo}</Text>
                      <Text style={styles.optionMeta}>Estado: {item.estado}</Text>
                      <Text style={styles.optionMeta}>Forma de pago: {item.modalidad_pago_label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {selectedServicio && paymentOptions.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, styles.subSectionTitle]}>Etapa de pago</Text>
                <View style={styles.typeGrid}>
                  {paymentOptions.map((option) => {
                    const active = option.tipo === form.etapa_pago;
                    return (
                      <TouchableOpacity
                        key={option.tipo}
                        style={[styles.typeCard, active && styles.optionCardActive]}
                        onPress={() => update('etapa_pago', option.tipo)}
                        activeOpacity={0.88}
                      >
                        <View style={[styles.typeIcon, { backgroundColor: 'rgba(6,182,212,0.18)' }]}>
                          <Ionicons name="cash-outline" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.typeTitle, active && styles.optionTitleActive]}>{option.label}</Text>
                        <Text style={styles.typeHelper}>Monto sugerido: S/ {option.monto}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.etapa_pago ? <Text style={styles.errorText}>{errors.etapa_pago}</Text> : null}
              </>
            ) : null}
          </View>
        )}

        {form.tipo_movimiento === 'prestamo' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Persona que debe</Text>
            <Text style={styles.sectionHint}>Selecciona al integrante que asumirá esta deuda.</Text>

            {loadingPrestamos ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Cargando integrantes del plan...</Text>
              </View>
            ) : !selectedPrestamoPlan ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Este plan no tiene grupo asociado, por eso no se pueden registrar préstamos aquí.</Text>
              </View>
            ) : deudores.length === 0 ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>No hay otros integrantes disponibles en este grupo.</Text>
              </View>
            ) : (
              <View style={styles.typeGrid}>
                {deudores.map((item) => {
                  const active = String(item.id) === String(form.deudor_id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.typeCard, active && styles.optionCardActive]}
                      onPress={() => update('deudor_id', String(item.id))}
                      activeOpacity={0.88}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: 'rgba(139,92,246,0.16)' }]}>
                        <Ionicons name="person-outline" size={18} color="#8B5CF6" />
                      </View>
                      <Text style={[styles.typeTitle, active && styles.optionTitleActive]}>{item.username}</Text>
                      <Text style={styles.typeHelper}>Integrante del grupo {selectedPrestamoPlan.grupo_nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {errors.deudor_id ? <Text style={styles.errorText}>{errors.deudor_id}</Text> : null}
          </View>
        )}

        {form.tipo_movimiento === 'pago_prestamo' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Deuda pendiente</Text>
            <Text style={styles.sectionHint}>Selecciona la deuda que vas a pagar o amortizar.</Text>

            {loadingDeudas ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Cargando préstamos donde eres deudor...</Text>
              </View>
            ) : deudas.length === 0 ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>No tienes préstamos pendientes por pagar.</Text>
              </View>
            ) : (
              <View style={styles.optionList}>
                {deudas.map((item) => {
                  const active = String(item.id) === String(form.prestamo_id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => update('prestamo_id', String(item.id))}
                      activeOpacity={0.88}
                    >
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>Deuda con {item.prestamista_username}</Text>
                      <Text style={styles.optionMeta}>Grupo: {item.grupo_nombre}</Text>
                      <Text style={styles.optionMeta}>Monto original: S/ {item.monto}</Text>
                      <Text style={styles.optionMeta}>Saldo pendiente: S/ {item.saldo_pendiente}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {errors.prestamo_id ? <Text style={styles.errorText}>{errors.prestamo_id}</Text> : null}
          </View>
        )}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Datos del movimiento</Text>
          <Text style={styles.sectionHint}>Completa lo esencial. Si seleccionaste contexto arriba, ya está casi listo.</Text>

          <Input
            label="Descripción"
            placeholder="Ej: Pago de reserva del tour"
            value={form.descripcion}
            onChangeText={(value) => update('descripcion', value)}
            leftIcon="document-text-outline"
            error={errors.descripcion}
            autoCapitalize="sentences"
          />

          <Input
            label="Monto"
            placeholder="0.00"
            value={form.monto}
            onChangeText={(value) => update('monto', value)}
            leftIcon="cash-outline"
            keyboardType="decimal-pad"
            error={errors.monto}
            editable={!selectedServicio}
          />

          <Input
            label="Fecha"
            placeholder="YYYY-MM-DD"
            value={form.fecha}
            onChangeText={(value) => update('fecha', value)}
            leftIcon="calendar-outline"
            error={errors.fecha}
          />
        </View>

        {form.tipo_movimiento === 'prestamo' && selectedPrestamoPlan && selectedDeudor ? (
          <View style={styles.tipBox}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text style={styles.tipText}>
              Se creará un préstamo para {selectedDeudor.username} dentro del grupo {selectedPrestamoPlan.grupo_nombre}.
            </Text>
          </View>
        ) : form.tipo_movimiento === 'pago_prestamo' && selectedDeuda ? (
          <View style={styles.tipBox}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={styles.tipText}>
              Puedes pagar hasta S/ {selectedDeuda.saldo_pendiente}. El sistema descontará ese monto del saldo pendiente.
            </Text>
          </View>
        ) : (
          <View style={styles.tipBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.tipText}>{selectedType.helper}</Text>
          </View>
        )}

        <Button title="Guardar movimiento" onPress={handleSave} loading={saving} style={styles.saveButton} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  content: { paddingBottom: spacing.xl + 24 },
  hero: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(6,182,212,0.22)',
  },
  heroBadgeText: { color: '#ECFEFF', fontSize: 12, fontWeight: '700' },
  headerTitle: { fontSize: 29, fontWeight: '800', color: '#FFFFFF', marginTop: spacing.md, lineHeight: 36 },
  headerSubtitle: { color: 'rgba(255,255,255,0.74)', marginTop: 8, lineHeight: 22, maxWidth: '94%' },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11.5, fontWeight: '600' },
  sectionBlock: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 24,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EDF5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionHint: { marginTop: 4, marginBottom: spacing.md, fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  subSectionTitle: { marginTop: spacing.md },
  typeGrid: { gap: spacing.sm },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DCE7F0',
    padding: spacing.md,
  },
  typeCardDisabled: { opacity: 0.45 },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  typeHelper: { fontSize: 12.5, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  optionList: { gap: spacing.sm },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DCE7F0',
    padding: spacing.md,
  },
  optionCardActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  optionTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  optionTitleActive: { color: colors.primary },
  optionMeta: { fontSize: 12.5, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  infoBox: {
    backgroundColor: '#F8FCFF',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#DCE7F0',
  },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#ECFEFF',
    borderRadius: 18,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  tipText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  saveButton: { marginTop: spacing.lg, marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  errorText: { fontSize: 12, color: colors.error, marginTop: 6 },
});
