import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupsApi } from '../../api/groups.api';
import { servicesApi } from '../../api/services.api';
import { financeApi } from '../../api/finance.api';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';

const ESTADO_COLORS = {
  borrador: { bg: '#E2E8F0', text: '#334155' },
  propuesto: { bg: '#FEF9C3', text: '#854D0E' },
  confirmado: { bg: '#DCFCE7', text: '#166534' },
  cancelado: { bg: '#FEE2E2', text: '#991B1B' },
  interes: { bg: '#E0F2FE', text: '#075985' },
};

const toInputDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISOorNull = (value) => (value ? new Date(value).toISOString() : null);

export default function GroupDetailScreen({ navigation, route }) {
  const { grupo } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [planes, setPlanes] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [organigramas, setOrganigramas] = useState({});

  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);

  const [planDraft, setPlanDraft] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [actividadDraft, setActividadDraft] = useState({
    plan: null,
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [asignacionDraft, setAsignacionDraft] = useState({
    actividad: null,
    servicio: null,
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [pendingPagoAsignacion, setPendingPagoAsignacion] = useState(null);
  const [selectedMovimientoPago, setSelectedMovimientoPago] = useState(null);

  const loadData = async () => {
    try {
      const [planesRes, actividadesRes, asignacionesRes, serviciosRes, movimientosRes] = await Promise.all([
        groupsApi.getPlanes(),
        groupsApi.getActividades(),
        groupsApi.getAsignacionesServicio(),
        servicesApi.getCatalogo(),
        financeApi.getMovimientos(),
      ]);
      
      const grupoPlanes = planesRes.data.filter((p) => p.grupo === grupo.id);
      const planIds = grupoPlanes.map((p) => p.id);
      const grupoActividades = actividadesRes.data.filter((a) => planIds.includes(a.plan));
      const actividadIds = grupoActividades.map((a) => a.id);
      const grupoAsignaciones = asignacionesRes.data.filter((a) => actividadIds.includes(a.actividad));

      setPlanes(grupoPlanes);
      setActividades(grupoActividades);
      setAsignaciones(grupoAsignaciones);
      setServicios(serviciosRes.data || []);
      setMovimientos((movimientosRes.data || []).filter((m) => m.tipo_movimiento === 'gasto'));

      if (!selectedPlanId && grupoPlanes.length > 0) setSelectedPlanId(grupoPlanes[0].id);

      const organigramaRequests = grupoPlanes.slice(0, 3).map(async (plan) => {
        const res = await groupsApi.getOrganigrama(plan.id);
        return [plan.id, res.data.organigrama || []];
      });
      const organigramaEntries = await Promise.all(organigramaRequests);
      setOrganigramas(Object.fromEntries(organigramaEntries));
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el tablero del plan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const selectedPlan = useMemo(
    () => planes.find((p) => p.id === selectedPlanId) || null,
    [planes, selectedPlanId]
  );

  const selectedActividades = useMemo(
    () => actividades.filter((a) => a.plan === selectedPlanId),
    [actividades, selectedPlanId]
  );

  const getServicio = (id) => servicios.find((s) => s.id === id);

  const handleCrearPlan = async () => {
    if (!planDraft.nombre || !planDraft.fecha_inicio || !planDraft.fecha_fin) {
      Alert.alert('Campos requeridos', 'Completa nombre, inicio y fin.');
      return;
    }

    setSubmitting(true);
    try {
      await groupsApi.createPlan({
        ...planDraft,
        grupo: grupo.id,
        tipo_plan: 'grupal',
        fecha_inicio: toISOorNull(planDraft.fecha_inicio),
        fecha_fin: toISOorNull(planDraft.fecha_fin),
      });
      setShowPlanModal(false);
      setPlanDraft({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });
      await loadData();
      Alert.alert('Listo', 'Plan creado. Tú eres el líder del plan grupal.');
    } catch (e) {
      const msg = e.response?.data ? Object.values(e.response.data).flat().join('\n') : 'No se pudo crear el plan';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrearActividad = async () => {
    if (!actividadDraft.plan || !actividadDraft.titulo || !actividadDraft.fecha_inicio || !actividadDraft.fecha_fin) {
      Alert.alert('Campos requeridos', 'Completa plan, título, inicio y fin.');
      return;
    }

    setSubmitting(true);
    try {
      await groupsApi.createActividad({
        ...actividadDraft,
        fecha_inicio: toISOorNull(actividadDraft.fecha_inicio),
        fecha_fin: toISOorNull(actividadDraft.fecha_fin),
      });
      setShowActividadModal(false);
      setActividadDraft({ plan: selectedPlanId, titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });
      await loadData();
    } catch (e) {
      const msg = e.response?.data ? Object.values(e.response.data).flat().join('\n') : 'No se pudo crear la actividad';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAsignarServicio = async () => {
    if (!asignacionDraft.actividad || !asignacionDraft.servicio || !asignacionDraft.fecha_inicio || !asignacionDraft.fecha_fin) {
      Alert.alert('Campos requeridos', 'Completa actividad, servicio, inicio y fin.');
      return;
    }

    setSubmitting(true);
    try {
      await groupsApi.createAsignacionServicio({
        ...asignacionDraft,
        fecha_inicio: toISOorNull(asignacionDraft.fecha_inicio),
        fecha_fin: toISOorNull(asignacionDraft.fecha_fin),
      });
      setShowAsignacionModal(false);
      setAsignacionDraft({ actividad: null, servicio: null, fecha_inicio: '', fecha_fin: '' });
      await loadData();
      Alert.alert('Servicio agregado', 'Se registró en estado INTERÉS en el organigrama.');
    } catch (e) {
      const msg = e.response?.data ? Object.values(e.response.data).flat().join('\n') : 'No se pudo asignar el servicio';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmarPago = async () => {
    if (!pendingPagoAsignacion || !selectedMovimientoPago) {
      Alert.alert('Falta pago', 'Selecciona un pago para confirmar el servicio.');
      return;
    }
    setSubmitting(true);
    try {
      await groupsApi.confirmarPagoServicio(pendingPagoAsignacion.id, selectedMovimientoPago);
      setShowPagoModal(false);
      setSelectedMovimientoPago(null);
      setPendingPagoAsignacion(null);
      await loadData();
      Alert.alert('Confirmado', 'El servicio pasó de interés a confirmado.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo confirmar el pago del servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSolicitarCambio = async () => {
    if (!selectedPlan) return;
    try {
      await groupsApi.updatePlan(selectedPlan.id, { nombre: `${selectedPlan.nombre} · Ajuste` });
      const solicitudes = await groupsApi.getSolicitudesCambio();
      const latest = (solicitudes.data || [])
        .filter((s) => s.plan === selectedPlan.id)
        .sort((a, b) => b.id - a.id)[0];

      if (latest) {
        await groupsApi.aprobarSolicitudCambio(latest.id);
      }
      await loadData();
      Alert.alert('Solicitud enviada', 'El cambio quedó pendiente para aprobación del grupo.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear la solicitud de cambio.');
    }
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{grupo.nombre}</Text>
        <Text style={styles.headerSubtitle}>Diseña el flujo ideal: plan → actividades → servicios</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <Card style={styles.flowCard}>
          <Text style={styles.flowTitle}>Flujo UX recomendado</Text>
          <Text style={styles.flowText}>1) Crea plan grupal con fecha/hora inicio-fin.</Text>
          <Text style={styles.flowText}>2) Divide en actividades con su propia agenda.</Text>
          <Text style={styles.flowText}>3) Asigna servicios en estado interés.</Text>
          <Text style={styles.flowText}>4) Confirma solo al registrar pago.</Text>
        </Card>

        <View style={styles.quickActions}>
          <Button title="Nuevo plan" onPress={() => setShowPlanModal(true)} />
          <Button title="Nueva actividad" variant="outline" onPress={() => {
            setActividadDraft((prev) => ({ ...prev, plan: selectedPlanId }));
            setShowActividadModal(true);
          }} />
          <Button title="Asignar servicio" variant="ghost" onPress={() => setShowAsignacionModal(true)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planes del grupo</Text>
          {planes.length === 0 ? (
            <EmptyState emoji="🗂️" title="Sin planes" subtitle="Crea el primer plan del grupo" />
          ) : (
            planes.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planOption, selectedPlanId === plan.id && styles.planOptionActive]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.planName}>{plan.nombre}</Text>
                  <StatusPill status={plan.estado} />
                </View>
                <Text style={styles.planMeta}>Líder: {plan.lider || plan.creado_por} · Tipo: {plan.tipo_plan}</Text>
                <Text style={styles.planMeta}>Inicio: {new Date(plan.fecha_inicio).toLocaleString()}</Text>
                <Text style={styles.planMeta}>Fin: {new Date(plan.fecha_fin).toLocaleString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {selectedPlan ? (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Organigrama del plan</Text>
              <TouchableOpacity onPress={handleSolicitarCambio}>
                <Text style={styles.linkBtn}>Solicitar cambio</Text>
              </TouchableOpacity>
            </View>

            {(organigramas[selectedPlan.id] || selectedActividades).length === 0 ? (
              <EmptyState emoji="🧩" title="Sin actividades" subtitle="Agrega actividades para estructurar el plan" />
            ) : (
              (organigramas[selectedPlan.id] || selectedActividades.map((a) => ({ ...a, servicios: [] }))).map((actividad) => (
                <Card key={actividad.actividad_id || actividad.id} style={styles.activityCard}>
                  <Text style={styles.activityTitle}>{actividad.titulo}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(actividad.fecha_inicio).toLocaleString()} → {new Date(actividad.fecha_fin).toLocaleString()}
                  </Text>

                  {(actividad.servicios || []).length === 0 ? (
                    <Text style={styles.emptyInline}>Sin servicios en esta actividad.</Text>
                  ) : (
                    actividad.servicios.map((s) => {
                      const servicio = getServicio(s.servicio_id);
                      return (
                        <View key={s.id} style={styles.serviceItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.serviceName}>{servicio?.nombre || s.servicio_nombre}</Text>
                            <Text style={styles.serviceTime}>{new Date(s.fecha_inicio).toLocaleString()} - {new Date(s.fecha_fin).toLocaleString()}</Text>
                          </View>
                          <StatusPill status={s.estado} />
                          {s.estado === 'interes' ? (
                            <TouchableOpacity
                              style={styles.payBtn}
                              onPress={() => {
                                const asignacion = asignaciones.find((a) => a.id === s.id);
                                setPendingPagoAsignacion(asignacion);
                                setShowPagoModal(true);
                              }}
                            >
                              <Ionicons name="wallet-outline" size={14} color={colors.success} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </Card>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <PlanModal
        visible={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        draft={planDraft}
        onChange={setPlanDraft}
        onSubmit={handleCrearPlan}
        loading={submitting}
      />

      <ActividadModal
        visible={showActividadModal}
        onClose={() => setShowActividadModal(false)}
        draft={actividadDraft}
        onChange={setActividadDraft}
        planes={planes}
        onSubmit={handleCrearActividad}
        loading={submitting}
      />

      <AsignacionModal
        visible={showAsignacionModal}
        onClose={() => setShowAsignacionModal(false)}
        draft={asignacionDraft}
        onChange={setAsignacionDraft}
        actividades={selectedActividades}
        servicios={servicios}
        onSubmit={handleAsignarServicio}
        loading={submitting}
      />

      <PagoModal
        visible={showPagoModal}
        onClose={() => setShowPagoModal(false)}
        movimientos={movimientos}
        selectedMovimientoPago={selectedMovimientoPago}
        onSelect={setSelectedMovimientoPago}
        onSubmit={handleConfirmarPago}
        loading={submitting}
      />
    </View>
  );
}

function StatusPill({ status }) {
  const tone = ESTADO_COLORS[status] || ESTADO_COLORS.propuesto;
  return (
    <View style={[styles.estadoBadge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.estadoText, { color: tone.text }]}>{status}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={styles.input} />
    </View>
  );
}

function BaseModal({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={colors.text} /></TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function PlanModal({ visible, onClose, draft, onChange, onSubmit, loading }) {
  return (
    <BaseModal visible={visible} onClose={onClose} title="Crear plan grupal">
      <Field label="Nombre" value={draft.nombre} onChangeText={(v) => onChange((p) => ({ ...p, nombre: v }))} placeholder="Viaje de finde" />
      <Field label="Descripción" value={draft.descripcion} onChangeText={(v) => onChange((p) => ({ ...p, descripcion: v }))} placeholder="Objetivo del plan" />
      <Field label="Inicio (YYYY-MM-DDTHH:mm)" value={draft.fecha_inicio} onChangeText={(v) => onChange((p) => ({ ...p, fecha_inicio: v }))} placeholder="2026-03-20T08:00" />
      <Field label="Fin (YYYY-MM-DDTHH:mm)" value={draft.fecha_fin} onChangeText={(v) => onChange((p) => ({ ...p, fecha_fin: v }))} placeholder="2026-03-20T22:00" />
      <Button title="Guardar plan" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />
    </BaseModal>
  );
}

function ActividadModal({ visible, onClose, draft, onChange, planes, onSubmit, loading }) {
  return (
    <BaseModal visible={visible} onClose={onClose} title="Crear actividad">
      <Text style={styles.fieldLabel}>Plan</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
        {planes.map((p) => (
          <TouchableOpacity key={p.id} style={[styles.chip, draft.plan === p.id && styles.chipActive]} onPress={() => onChange((prev) => ({ ...prev, plan: p.id }))}>
            <Text style={styles.chipText}>{p.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Field label="Título" value={draft.titulo} onChangeText={(v) => onChange((p) => ({ ...p, titulo: v }))} placeholder="Desayuno" />
      <Field label="Descripción" value={draft.descripcion} onChangeText={(v) => onChange((p) => ({ ...p, descripcion: v }))} placeholder="Detalle" />
      <Field label="Inicio" value={draft.fecha_inicio} onChangeText={(v) => onChange((p) => ({ ...p, fecha_inicio: v }))} placeholder="2026-03-20T09:00" />
      <Field label="Fin" value={draft.fecha_fin} onChangeText={(v) => onChange((p) => ({ ...p, fecha_fin: v }))} placeholder="2026-03-20T11:00" />
      <Button title="Guardar actividad" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />
    </BaseModal>
  );
}

function AsignacionModal({ visible, onClose, draft, onChange, actividades, servicios, onSubmit, loading }) {
  return (
    <BaseModal visible={visible} onClose={onClose} title="Asignar servicio">
      <Text style={styles.fieldLabel}>Actividad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
        {actividades.map((a) => (
          <TouchableOpacity key={a.id} style={[styles.chip, draft.actividad === a.id && styles.chipActive]} onPress={() => onChange((p) => ({ ...p, actividad: a.id, fecha_inicio: toInputDateTime(a.fecha_inicio), fecha_fin: toInputDateTime(a.fecha_fin) }))}>
            <Text style={styles.chipText}>{a.titulo}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.fieldLabel}>Servicio</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
        {servicios.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.chip, draft.servicio === s.id && styles.chipActive]} onPress={() => onChange((p) => ({ ...p, servicio: s.id }))}>
            <Text style={styles.chipText}>{s.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Field label="Inicio" value={draft.fecha_inicio} onChangeText={(v) => onChange((p) => ({ ...p, fecha_inicio: v }))} placeholder="2026-03-20T10:00" />
      <Field label="Fin" value={draft.fecha_fin} onChangeText={(v) => onChange((p) => ({ ...p, fecha_fin: v }))} placeholder="2026-03-20T12:00" />

      <Button title="Asignar en interés" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />
    </BaseModal>
  );
}

function PagoModal({ visible, onClose, movimientos, selectedMovimientoPago, onSelect, onSubmit, loading }) {
  return (
    <BaseModal visible={visible} onClose={onClose} title="Confirmar servicio con pago">
      {movimientos.length === 0 ? (
        <Text style={styles.emptyInline}>No tienes gastos registrados. Registra un pago en Finanzas.</Text>
      ) : (
        <ScrollView style={{ maxHeight: 220 }}>
          {movimientos.map((m) => (
            <TouchableOpacity key={m.id} style={[styles.paymentRow, selectedMovimientoPago === m.id && styles.paymentRowActive]} onPress={() => onSelect(m.id)}>
              <Text style={styles.paymentTitle}>{m.descripcion}</Text>
              <Text style={styles.paymentMeta}>S/ {m.monto} · {m.fecha}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <Button title="Confirmar servicio" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.secondary, paddingTop: 50, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  content: { padding: spacing.lg, gap: spacing.md },
  flowCard: { backgroundColor: '#EEF2FF' },
  flowTitle: { fontWeight: '700', fontSize: 14, color: '#312E81', marginBottom: 6 },
  flowText: { fontSize: 12, color: '#3730A3', marginBottom: 2 },
  quickActions: { gap: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  planOption: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  planOptionActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  planName: { fontSize: 14, fontWeight: '700', color: colors.text },
  planMeta: { fontSize: 12, color: colors.textSecondary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkBtn: { fontSize: 12, fontWeight: '700', color: colors.primary },
  activityCard: { gap: spacing.xs },
  activityTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  activityTime: { fontSize: 12, color: colors.textSecondary },
  emptyInline: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  serviceName: { fontSize: 13, fontWeight: '600', color: colors.text },
  serviceTime: { fontSize: 11, color: colors.textSecondary },
  payBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  estadoText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { backgroundColor: colors.surface, borderTopRightRadius: 24, borderTopLeftRadius: 24, padding: spacing.lg, gap: spacing.sm, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, backgroundColor: colors.background },
  chipActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  paymentRow: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs },
  paymentRowActive: { borderColor: colors.success, backgroundColor: '#DCFCE7' },
  paymentTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  paymentMeta: { fontSize: 12, color: colors.textSecondary },
});