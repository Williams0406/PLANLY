import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupsApi } from '../../api/groups.api';
import { servicesApi } from '../../api/services.api';
import { usersApi } from '../../api/users.api';
import { colors, spacing, radius } from '../../theme';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';

const STATUS_LABEL = {
  interes: 'Interés',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
};

const STATUS_COLOR = {
  interes: colors.warning,
  confirmado: colors.success,
  cancelado: colors.error,
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const toISOorNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const shiftDate = (value, { days = 0, hours = 0, minutes = 0 }) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

function DateTimeSelector({ label, value, placeholder, onPress }) {
  return (
    <View>
      <Text style={styles.pickerLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerTrigger} onPress={onPress}>
        <Text style={[styles.pickerTriggerText, !value && styles.pickerPlaceholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function SmallAction({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.smallAction} onPress={onPress}>
      <Text style={styles.smallActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function PlansScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [submittingActividad, setSubmittingActividad] = useState(false);
  const [submittingAsignacion, setSubmittingAsignacion] = useState(false);

  const [planes, setPlanes] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedActividadId, setSelectedActividadId] = useState(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [showActividadDetailModal, setShowActividadDetailModal] = useState(false);

  const [datePicker, setDatePicker] = useState({
    visible: false,
    scope: 'plan',
    field: 'fecha_inicio',
    tempDate: new Date(),
  });

  const [planDraft, setPlanDraft] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [actividadDraft, setActividadDraft] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [asignacionDraft, setAsignacionDraft] = useState({
    servicio: null,
    fecha_inicio: '',
    fecha_fin: '',
  });

  const openDatePicker = (scope, field, rawValue) => {
    const parsed = rawValue ? new Date(rawValue) : new Date();
    setDatePicker({
      visible: true,
      scope,
      field,
      tempDate: Number.isNaN(parsed.getTime()) ? new Date() : parsed,
    });
  };

  const applyDatePicker = () => {
    const value = datePicker.tempDate.toISOString();
    if (datePicker.scope === 'plan') {
      setPlanDraft((prev) => ({ ...prev, [datePicker.field]: value }));
    }
    if (datePicker.scope === 'actividad') {
      setActividadDraft((prev) => ({ ...prev, [datePicker.field]: value }));
    }
    if (datePicker.scope === 'asignacion') {
      setAsignacionDraft((prev) => ({ ...prev, [datePicker.field]: value }));
    }
    setDatePicker((prev) => ({ ...prev, visible: false }));
  };

  const loadData = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) setRefreshing(true);
      else setLoading(true);

      const [meRes, planesRes, actividadesRes, asignacionesRes, serviciosRes] =
        await Promise.allSettled([
          usersApi.getMe(),
          groupsApi.getPlanes(),
          groupsApi.getActividades(),
          groupsApi.getAsignacionesServicio(),
          servicesApi.getCatalogo(),
        ]);

      if (planesRes.status === 'rejected') throw planesRes.reason;

      const currentUserId = meRes.status === 'fulfilled' ? meRes.value.data?.id || null : null;

      const allPlans = normalizeList(planesRes.value.data);
      const myPlans = currentUserId
        ? allPlans.filter((plan) => Number(plan.creado_por) === Number(currentUserId))
        : allPlans;

      const planIds = myPlans.map((p) => p.id);

      const allActividades =
        actividadesRes.status === 'fulfilled' ? normalizeList(actividadesRes.value.data) : [];
      const actividadesPlan = allActividades.filter((act) => planIds.includes(act.plan));
      const actividadIds = actividadesPlan.map((a) => a.id);

      const allAsignaciones =
        asignacionesRes.status === 'fulfilled' ? normalizeList(asignacionesRes.value.data) : [];
      const asignacionesPlan = allAsignaciones.filter((a) => actividadIds.includes(a.actividad));

      const catalogoServicios =
        serviciosRes.status === 'fulfilled' ? normalizeList(serviciosRes.value.data) : [];

      setPlanes(myPlans);
      setActividades(actividadesPlan);
      setAsignaciones(asignacionesPlan);
      setServicios(catalogoServicios);

      if (selectedPlanId && !myPlans.some((p) => p.id === selectedPlanId)) {
        setSelectedPlanId(null);
      }
      if (selectedActividadId && !actividadesPlan.some((a) => a.id === selectedActividadId)) {
        setSelectedActividadId(null);
      }
    } catch (e) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'No se pudo cargar la información de planes.';
      Alert.alert('Error', msg);
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
    () => planes.find((plan) => plan.id === selectedPlanId) || null,
    [planes, selectedPlanId]
  );

  const selectedActividades = useMemo(() => {
    if (!selectedPlanId) return [];
    return actividades
      .filter((actividad) => actividad.plan === selectedPlanId)
      .map((actividad) => ({
        ...actividad,
        servicios: asignaciones.filter((s) => s.actividad === actividad.id),
      }))
      .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
  }, [actividades, asignaciones, selectedPlanId]);

  const selectedActividad = useMemo(
    () => selectedActividades.find((a) => a.id === selectedActividadId) || null,
    [selectedActividades, selectedActividadId]
  );

  const getServicio = (id) => servicios.find((s) => s.id === id);

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setSelectedActividadId(null);
  };

  const resetPlanDraft = () => {
    setPlanDraft({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });
  };

  const resetActividadDraft = () => {
    setActividadDraft({ titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });
  };

  const resetAsignacionDraft = () => {
    setAsignacionDraft({ servicio: null, fecha_inicio: '', fecha_fin: '' });
  };

  const handleCrearPlan = async () => {
    if (!planDraft.nombre || !planDraft.fecha_inicio || !planDraft.fecha_fin) {
      Alert.alert('Campos requeridos', 'Completa nombre, fecha de inicio y fecha de fin.');
      return;
    }

    const payload = {
      ...planDraft,
      tipo_plan: 'individual',
      grupo: null,
      fecha_inicio: toISOorNull(planDraft.fecha_inicio),
      fecha_fin: toISOorNull(planDraft.fecha_fin),
    };

    if (!payload.fecha_inicio || !payload.fecha_fin) {
      Alert.alert('Fechas inválidas', 'Selecciona fecha y hora válidas.');
      return;
    }

    if (new Date(payload.fecha_inicio) >= new Date(payload.fecha_fin)) {
      Alert.alert('Rango inválido', 'La fecha/hora de fin debe ser posterior al inicio.');
      return;
    }

    setSubmittingPlan(true);
    try {
      await groupsApi.createPlan(payload);
      setShowPlanModal(false);
      resetPlanDraft();
      await loadData(true);
      Alert.alert('Listo', 'Plan creado correctamente.');
    } catch (e) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'No se pudo crear el plan.';
      Alert.alert('Error', msg);
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleCrearActividad = async () => {
    if (!selectedPlanId) {
      Alert.alert('Selecciona un plan', 'Primero selecciona un plan para crear la actividad.');
      return;
    }
    if (!actividadDraft.titulo || !actividadDraft.fecha_inicio || !actividadDraft.fecha_fin) {
      Alert.alert('Campos requeridos', 'Completa título, inicio y fin de la actividad.');
      return;
    }

    const payload = {
      plan: selectedPlanId,
      titulo: actividadDraft.titulo,
      descripcion: actividadDraft.descripcion,
      fecha_inicio: toISOorNull(actividadDraft.fecha_inicio),
      fecha_fin: toISOorNull(actividadDraft.fecha_fin),
    };

    if (!payload.fecha_inicio || !payload.fecha_fin) {
      Alert.alert('Fechas inválidas', 'Selecciona fecha y hora válidas.');
      return;
    }

    if (new Date(payload.fecha_inicio) >= new Date(payload.fecha_fin)) {
      Alert.alert('Rango inválido', 'La hora fin debe ser posterior a la hora inicio.');
      return;
    }

    setSubmittingActividad(true);
    try {
      await groupsApi.createActividad(payload);
      setShowActividadModal(false);
      resetActividadDraft();
      await loadData(true);
      Alert.alert('Listo', 'Actividad creada correctamente.');
    } catch (e) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'No se pudo crear la actividad.';
      Alert.alert('Error', msg);
    } finally {
      setSubmittingActividad(false);
    }
  };

  const openActividadDetail = (actividadId) => {
    setSelectedActividadId(actividadId);
    resetAsignacionDraft();
    setShowActividadDetailModal(true);
  };

  const handleAsignarServicio = async () => {
    if (!selectedActividad) return;
    if (!asignacionDraft.servicio || !asignacionDraft.fecha_inicio || !asignacionDraft.fecha_fin) {
      Alert.alert('Campos requeridos', 'Selecciona servicio, inicio y fin.');
      return;
    }

    const payload = {
      actividad: selectedActividad.id,
      servicio: asignacionDraft.servicio,
      fecha_inicio: toISOorNull(asignacionDraft.fecha_inicio),
      fecha_fin: toISOorNull(asignacionDraft.fecha_fin),
    };

    if (!payload.fecha_inicio || !payload.fecha_fin) {
      Alert.alert('Fechas inválidas', 'Selecciona fecha y hora válidas.');
      return;
    }

    if (new Date(payload.fecha_inicio) >= new Date(payload.fecha_fin)) {
      Alert.alert('Rango inválido', 'La hora fin debe ser posterior a la hora inicio.');
      return;
    }

    setSubmittingAsignacion(true);
    try {
      await groupsApi.createAsignacionServicio(payload);
      await loadData(true);
      resetAsignacionDraft();
      Alert.alert('Listo', 'Servicio asignado a la actividad.');
    } catch (e) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'No se pudo asignar el servicio.';
      Alert.alert('Error', msg);
    } finally {
      setSubmittingAsignacion(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Planes</Text>
          <Text style={styles.headerSubtitle}>Selecciona un plan para ver su detalle</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowPlanModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {planes.length === 0 ? (
          <Card>
            <EmptyState
              emoji="🗂️"
              title="Aún no creaste planes"
              subtitle="Pulsa + para crear tu primer plan"
            />
          </Card>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planChips}>
              {planes.map((plan) => {
                const isActive = plan.id === selectedPlanId;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => handleSelectPlan(plan.id)}
                    style={[styles.planChip, isActive && styles.planChipActive]}
                  >
                    <Text style={[styles.planChipText, isActive && styles.planChipTextActive]}>
                      {plan.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {!selectedPlan ? (
              <Card>
                <EmptyState
                  emoji="👆"
                  title="Selecciona un plan"
                  subtitle="Al elegir un plan verás su línea de tiempo y podrás crear actividades"
                />
              </Card>
            ) : (
              <>
                <Card>
                  <Text style={styles.selectedPlanName}>{selectedPlan.nombre}</Text>
                  <Text style={styles.selectedPlanMeta}>
                    {formatDate(selectedPlan.fecha_inicio)} → {formatDate(selectedPlan.fecha_fin)}
                  </Text>
                  {!!selectedPlan.descripcion && (
                    <Text style={styles.selectedPlanDesc}>{selectedPlan.descripcion}</Text>
                  )}

                  <Button
                    title="Crear actividad"
                    onPress={() => setShowActividadModal(true)}
                    style={styles.createActivityBtn}
                  />
                </Card>

                <Card>
                  <Text style={styles.timelineTitle}>Línea de tiempo del plan</Text>

                  {selectedActividades.length === 0 ? (
                    <EmptyState
                      emoji="⏳"
                      title="Sin actividades"
                      subtitle="Crea una actividad para empezar la línea de tiempo"
                    />
                  ) : (
                    <View style={styles.timelineWrap}>
                      {selectedActividades.map((actividad, index) => (
                        <TouchableOpacity
                          key={actividad.id}
                          activeOpacity={0.85}
                          onPress={() => openActividadDetail(actividad.id)}
                          style={styles.timelineItem}
                        >
                          <View style={styles.timelineRail}>
                            <View style={styles.timelineDot} />
                            {index < selectedActividades.length - 1 ? <View style={styles.timelineLine} /> : null}
                          </View>

                          <View style={styles.timelineBody}>
                            <View style={styles.activityHeaderRow}>
                              <Text style={styles.activityTitle}>{actividad.titulo}</Text>
                              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                            </View>
                            <Text style={styles.activityMeta}>
                              {formatDate(actividad.fecha_inicio)} → {formatDate(actividad.fecha_fin)}
                            </Text>
                            {!!actividad.descripcion && (
                              <Text style={styles.activityDesc}>{actividad.descripcion}</Text>
                            )}
                            <Text style={styles.activityHint}>
                              {actividad.servicios.length > 0
                                ? `${actividad.servicios.length} servicio(s) asignado(s)`
                                : 'Sin servicios asignados'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showPlanModal} transparent animationType="slide" onRequestClose={() => setShowPlanModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear plan</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Nombre"
              placeholder="Ej: Viaje de aniversario"
              value={planDraft.nombre}
              onChangeText={(v) => setPlanDraft((p) => ({ ...p, nombre: v }))}
            />
            <Input
              label="Descripción"
              placeholder="Detalles del plan"
              value={planDraft.descripcion}
              onChangeText={(v) => setPlanDraft((p) => ({ ...p, descripcion: v }))}
            />
            <DateTimeSelector
              label="Inicio"
              value={planDraft.fecha_inicio}
              placeholder="Seleccionar fecha y hora"
              onPress={() => openDatePicker('plan', 'fecha_inicio', planDraft.fecha_inicio)}
            />
            <DateTimeSelector
              label="Fin"
              value={planDraft.fecha_fin}
              placeholder="Seleccionar fecha y hora"
              onPress={() => openDatePicker('plan', 'fecha_fin', planDraft.fecha_fin)}
            />

            <Button
              title={submittingPlan ? 'Guardando...' : 'Crear plan'}
              onPress={handleCrearPlan}
              loading={submittingPlan}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showActividadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActividadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear actividad</Text>
              <TouchableOpacity onPress={() => setShowActividadModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Título"
              placeholder="Ej: Reserva del local"
              value={actividadDraft.titulo}
              onChangeText={(v) => setActividadDraft((p) => ({ ...p, titulo: v }))}
            />
            <Input
              label="Descripción"
              placeholder="Detalle de la actividad"
              value={actividadDraft.descripcion}
              onChangeText={(v) => setActividadDraft((p) => ({ ...p, descripcion: v }))}
            />
            <DateTimeSelector
              label="Inicio"
              value={actividadDraft.fecha_inicio}
              placeholder="Seleccionar fecha y hora"
              onPress={() =>
                openDatePicker('actividad', 'fecha_inicio', actividadDraft.fecha_inicio)
              }
            />
            <DateTimeSelector
              label="Fin"
              value={actividadDraft.fecha_fin}
              placeholder="Seleccionar fecha y hora"
              onPress={() => openDatePicker('actividad', 'fecha_fin', actividadDraft.fecha_fin)}
            />

            <Button
              title={submittingActividad ? 'Guardando...' : 'Crear actividad'}
              onPress={handleCrearActividad}
              loading={submittingActividad}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showActividadDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActividadDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle de actividad</Text>
              <TouchableOpacity onPress={() => setShowActividadDetailModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {!selectedActividad ? (
              <EmptyState emoji="⚠️" title="Actividad no encontrada" subtitle="Vuelve a seleccionar la actividad" />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.activityDetailTitle}>{selectedActividad.titulo}</Text>
                <Text style={styles.activityMeta}>
                  {formatDate(selectedActividad.fecha_inicio)} → {formatDate(selectedActividad.fecha_fin)}
                </Text>
                {!!selectedActividad.descripcion && (
                  <Text style={styles.activityDesc}>{selectedActividad.descripcion}</Text>
                )}

                <Text style={styles.sectionTitle}>Servicios asignados</Text>
                {selectedActividad.servicios.length === 0 ? (
                  <Text style={styles.emptyInfo}>No hay servicios asignados a esta actividad.</Text>
                ) : (
                  selectedActividad.servicios.map((asig) => {
                    const servicio = getServicio(asig.servicio);
                    const statusColor = STATUS_COLOR[asig.estado] || colors.textSecondary;
                    return (
                      <View key={asig.id} style={styles.serviceRow}>
                        <View style={styles.serviceTopRow}>
                          <Text style={styles.serviceName}>
                            {servicio?.nombre || `Servicio #${asig.servicio}`}
                          </Text>
                          <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>
                              {STATUS_LABEL[asig.estado] || asig.estado}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.serviceMeta}>
                          {formatDate(asig.fecha_inicio)} → {formatDate(asig.fecha_fin)}
                        </Text>
                      </View>
                    );
                  })
                )}

                <Text style={styles.sectionTitle}>Asignar servicio</Text>
                {servicios.length === 0 ? (
                  <Text style={styles.emptyInfo}>No hay servicios disponibles en el catálogo.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceChips}>
                    {servicios.map((servicio) => {
                      const isActive = Number(asignacionDraft.servicio) === Number(servicio.id);
                      return (
                        <TouchableOpacity
                          key={servicio.id}
                          style={[styles.serviceChip, isActive && styles.serviceChipActive]}
                          onPress={() => setAsignacionDraft((p) => ({ ...p, servicio: servicio.id }))}
                        >
                          <Text style={[styles.serviceChipText, isActive && styles.serviceChipTextActive]}>
                            {servicio.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                <DateTimeSelector
                  label="Inicio servicio"
                  value={asignacionDraft.fecha_inicio}
                  placeholder="Seleccionar fecha y hora"
                  onPress={() =>
                    openDatePicker('asignacion', 'fecha_inicio', asignacionDraft.fecha_inicio)
                  }
                />
                <DateTimeSelector
                  label="Fin servicio"
                  value={asignacionDraft.fecha_fin}
                  placeholder="Seleccionar fecha y hora"
                  onPress={() =>
                    openDatePicker('asignacion', 'fecha_fin', asignacionDraft.fecha_fin)
                  }
                />

                <Button
                  title={submittingAsignacion ? 'Guardando...' : 'Asignar servicio'}
                  onPress={handleAsignarServicio}
                  loading={submittingAsignacion}
                  disabled={servicios.length === 0}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={datePicker.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePicker((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.dateCard}>
            <Text style={styles.dateTitle}>Seleccionar fecha y hora</Text>
            <Text style={styles.dateValue}>{formatDate(datePicker.tempDate.toISOString())}</Text>

            <View style={styles.dateActionsRow}>
              <SmallAction
                label="- Día"
                onPress={() => setDatePicker((p) => ({ ...p, tempDate: shiftDate(p.tempDate, { days: -1 }) }))}
              />
              <SmallAction
                label="+ Día"
                onPress={() => setDatePicker((p) => ({ ...p, tempDate: shiftDate(p.tempDate, { days: 1 }) }))}
              />
            </View>
            <View style={styles.dateActionsRow}>
              <SmallAction
                label="- Hora"
                onPress={() => setDatePicker((p) => ({ ...p, tempDate: shiftDate(p.tempDate, { hours: -1 }) }))}
              />
              <SmallAction
                label="+ Hora"
                onPress={() => setDatePicker((p) => ({ ...p, tempDate: shiftDate(p.tempDate, { hours: 1 }) }))}
              />
            </View>
            <View style={styles.dateActionsRow}>
              <SmallAction
                label="- 15 min"
                onPress={() => setDatePicker((p) => ({ ...p, tempDate: shiftDate(p.tempDate, { minutes: -15 }) }))}
              />
              <SmallAction
                label="+ 15 min"
                onPress={() => setDatePicker((p) => ({ ...p, tempDate: shiftDate(p.tempDate, { minutes: 15 }) }))}
              />
            </View>

            <View style={styles.dateFooterRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDatePicker((prev) => ({ ...prev, visible: false }))}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={applyDatePicker}>
                <Text style={styles.confirmText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.secondary,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', marginTop: 4, fontSize: 13 },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.lg, gap: spacing.md },

  planChips: { gap: spacing.sm, paddingRight: spacing.lg },
  planChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  planChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  planChipText: { color: colors.textSecondary, fontWeight: '600' },
  planChipTextActive: { color: colors.primary },

  selectedPlanName: { fontSize: 18, fontWeight: '700', color: colors.text },
  selectedPlanMeta: { marginTop: 6, color: colors.textSecondary, fontSize: 12 },
  selectedPlanDesc: { marginTop: spacing.sm, color: colors.text },
  createActivityBtn: { marginTop: spacing.md },

  timelineTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  timelineWrap: { gap: spacing.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'stretch' },
  timelineRail: { width: 24, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },
  timelineBody: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  activityTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  activityMeta: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
  activityDesc: { marginTop: spacing.xs, fontSize: 13, color: colors.text },
  activityHint: { marginTop: spacing.xs, fontSize: 12, color: colors.primary, fontWeight: '600' },

  serviceRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  serviceTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  serviceName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  serviceMeta: { marginTop: 4, fontSize: 11, color: colors.textSecondary },
  badge: { borderRadius: radius.xl, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.sm, fontSize: 14, fontWeight: '700', color: colors.text },
  emptyInfo: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  serviceChips: { gap: spacing.sm, paddingBottom: spacing.sm },
  serviceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  serviceChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  serviceChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  serviceChipTextActive: { color: colors.primary },
  activityDetailTitle: { fontSize: 16, fontWeight: '800', color: colors.text },

  pickerLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  pickerTrigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTriggerText: { color: colors.text, fontSize: 14 },
  pickerPlaceholder: { color: colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: '90%',
  },
  modalCardLarge: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '93%',
    minHeight: '65%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dateCard: { width: '100%', backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  dateTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  dateValue: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs },
  dateActionsRow: { flexDirection: 'row', gap: spacing.sm },
  smallAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  smallActionText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  dateFooterRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '700' },
});