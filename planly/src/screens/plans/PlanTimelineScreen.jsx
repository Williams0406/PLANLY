import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { groupsApi } from '../../api/groups.api';
import { servicesApi } from '../../api/services.api';
import { colors, radius, spacing } from '../../theme';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import DateTimeField from '../../components/ui/DateTimeField';
import { formatDateTimeDisplay, formatDateTimeInput, toISOFromInput } from '../../utils/datetime';

const normalizeList = (payload) => (Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []);

const formatGapLabel = (start, end) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diff) || diff <= 0) return 'Espacio disponible';
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 60) return `${minutes} min libres`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h libres` : `${hours} h ${rest} min libres`;
};

const getStatusTone = (actividad) => {
  if (actividad.servicios.length > 0) {
    return {
      label: 'Servicio asignado',
      icon: 'checkmark-circle',
      bg: '#DCFCE7',
      text: '#166534',
      border: '#BBF7D0',
    };
  }

  return {
    label: 'Sin servicio',
    icon: 'sparkles-outline',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  };
};

export default function PlanTimelineScreen({ route, navigation }) {
  const plan = route.params?.plan;
  const [actividades, setActividades] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draft, setDraft] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: formatDateTimeInput(plan?.fecha_inicio),
    fecha_fin: formatDateTimeInput(plan?.fecha_fin),
  });
  const [catalogoServicios, setCatalogoServicios] = useState([]);

  const load = async () => {
    try {
      setRefreshing(true);
      const [acts, asigs, serviciosRes] = await Promise.all([
        groupsApi.getActividades(),
        groupsApi.getAsignacionesServicio(),
        servicesApi.getCatalogo(),
      ]);
      setActividades(normalizeList(acts.data).filter((x) => x.plan === plan.id));
      setAsignaciones(normalizeList(asigs.data));
      setCatalogoServicios(normalizeList(serviciosRes.data));
    } catch {
      Alert.alert('Error', 'No se pudo cargar el timeline.');
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [plan?.id])
  );

  const actividadesOrdenadas = useMemo(
    () =>
      actividades
        .map((actividad) => ({
          ...actividad,
          servicios: asignaciones.filter((a) => a.actividad === actividad.id),
        }))
        .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()),
    [actividades, asignaciones]
  );

  const timelineItems = useMemo(() => {
    const items = [];
    const planStart = plan?.fecha_inicio;
    const planEnd = plan?.fecha_fin;

    if (actividadesOrdenadas.length === 0 && planStart && planEnd) {
      return [
        {
          type: 'gap',
          id: 'gap-all',
          start: planStart,
          end: planEnd,
        },
      ];
    }

    let pointer = planStart;

    actividadesOrdenadas.forEach((actividad) => {
      if (pointer && new Date(actividad.fecha_inicio) > new Date(pointer)) {
        items.push({
          type: 'gap',
          id: `gap-before-${actividad.id}`,
          start: pointer,
          end: actividad.fecha_inicio,
        });
      }

      items.push({
        type: 'activity',
        id: actividad.id,
        data: actividad,
      });

      if (!pointer || new Date(actividad.fecha_fin) > new Date(pointer)) {
        pointer = actividad.fecha_fin;
      }
    });

    if (pointer && planEnd && new Date(planEnd) > new Date(pointer)) {
      items.push({
        type: 'gap',
        id: 'gap-end',
        start: pointer,
        end: planEnd,
      });
    }

    return items;
  }, [actividadesOrdenadas, plan?.fecha_fin, plan?.fecha_inicio]);

  const summary = useMemo(() => {
    const conServicio = actividadesOrdenadas.filter((item) => item.servicios.length > 0).length;
    const sinServicio = actividadesOrdenadas.length - conServicio;
    const huecos = timelineItems.filter((item) => item.type === 'gap').length;

    return [
      { label: 'Actividades', value: actividadesOrdenadas.length, icon: 'albums-outline' },
      { label: 'Con servicio', value: conServicio, icon: 'checkmark-done-outline' },
      { label: 'Espacios libres', value: huecos, icon: 'scan-outline' },
      { label: 'Por completar', value: Math.max(sinServicio, 0), icon: 'sparkles-outline' },
    ];
  }, [actividadesOrdenadas, timelineItems]);

  const createActividad = async () => {
    const fechaInicio = toISOFromInput(draft.fecha_inicio);
    const fechaFin = toISOFromInput(draft.fecha_fin);

    if (!draft.titulo || !fechaInicio || !fechaFin) {
      Alert.alert('Campos requeridos', 'Completa título, inicio y fin.');
      return;
    }

    setSaving(true);
    try {
      await groupsApi.createActividad({
        ...draft,
        plan: plan.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      setShowCreateModal(false);
      setDraft({
        titulo: '',
        descripcion: '',
        fecha_inicio: formatDateTimeInput(plan?.fecha_inicio),
        fecha_fin: formatDateTimeInput(plan?.fecha_fin),
      });
      await load();
    } catch {
      Alert.alert('Error', 'No se pudo crear la actividad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Ionicons name="git-network-outline" size={16} color="#67E8F9" />
            <Text style={styles.heroBadgeText}>Timeline del plan</Text>
          </View>

          <Text style={styles.heroTitle}>{plan.nombre}</Text>
          <Text style={styles.heroSub}>
            {formatDateTimeDisplay(plan.fecha_inicio)} → {formatDateTimeDisplay(plan.fecha_fin)}
          </Text>

          <TouchableOpacity style={styles.summaryToggle} onPress={() => setShowSummary((prev) => !prev)} activeOpacity={0.85}>
            <View style={styles.summaryToggleLeft}>
              <Ionicons name="bar-chart-outline" size={16} color="#CFFAFE" />
              <Text style={styles.summaryToggleText}>{showSummary ? 'Ocultar resumen' : 'Ver resumen'}</Text>
            </View>
            <Ionicons name={showSummary ? 'chevron-up' : 'chevron-down'} size={18} color="#CFFAFE" />
          </TouchableOpacity>

          {showSummary ? (
            <View style={styles.summaryGrid}>
              {summary.map((item) => (
                <View key={item.label} style={styles.summaryCard}>
                  <Ionicons name={item.icon} size={17} color={colors.primary} />
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.actions}>
          <Button title="Crear actividad" onPress={() => setShowCreateModal(true)} />
        </View>

        <View style={styles.timelineWrap}>
          <View style={styles.timelineHeader}>
            <View>
              <Text style={styles.sectionTitle}>Línea de tiempo</Text>
              <Text style={styles.sectionSubtitle}>Identifica rápido actividades cerradas, pendientes y espacios libres.</Text>
            </View>
          </View>

          {timelineItems.length === 0 ? (
            <EmptyState
              emoji="⏱️"
              title="Sin actividades"
              subtitle="Crea la primera actividad para empezar a construir este plan."
            />
          ) : (
            <View style={styles.timelineList}>
              {timelineItems.map((item, index) => {
                const isLast = index === timelineItems.length - 1;

                if (item.type === 'gap') {
                  return (
                    <View key={item.id} style={styles.timelineRow}>
                      <View style={styles.rail}>
                        <View style={[styles.dot, styles.dotGap]} />
                        {!isLast && <View style={[styles.line, styles.lineGap]} />}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => {
                          setDraft((prev) => ({
                            ...prev,
                            fecha_inicio: formatDateTimeInput(item.start),
                            fecha_fin: formatDateTimeInput(item.end),
                          }));
                          setShowCreateModal(true);
                        }}
                        style={styles.gapCard}
                      >
                        <View style={styles.rowBetween}>
                          <View style={styles.inlineBadgeGap}>
                            <Ionicons name="add-circle-outline" size={14} color="#0C4A6E" />
                            <Text style={styles.inlineBadgeGapText}>Espacio disponible</Text>
                          </View>
                          <Text style={styles.gapDuration}>{formatGapLabel(item.start, item.end)}</Text>
                        </View>

                        <Text style={styles.gapWindow}>
                          {formatDateTimeDisplay(item.start)} → {formatDateTimeDisplay(item.end)}
                        </Text>
                        <Text style={styles.gapHint}>Toca para crear una actividad dentro de este bloque.</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                const actividad = item.data;
                const tone = getStatusTone(actividad);

                return (
                  <View key={actividad.id} style={styles.timelineRow}>
                    <View style={styles.rail}>
                      <View style={[styles.dot, { backgroundColor: tone.text }]} />
                      {!isLast && <View style={styles.line} />}
                    </View>

                    <View style={styles.timelineCard}>
                      <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{actividad.titulo}</Text>
                          <Text style={styles.itemMeta}>
                            {formatDateTimeDisplay(actividad.fecha_inicio)} → {formatDateTimeDisplay(actividad.fecha_fin)}
                          </Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                          <Ionicons name={tone.icon} size={14} color={tone.text} />
                          <Text style={[styles.statusBadgeText, { color: tone.text }]}>{tone.label}</Text>
                        </View>
                      </View>

                      {!!actividad.descripcion && <Text style={styles.itemText}>{actividad.descripcion}</Text>}

                      <TouchableOpacity
                        style={[
                          styles.assignButton,
                          actividad.servicios.length > 0 && styles.assignButtonActive,
                        ]}
                        onPress={() => navigation.navigate('ServiceCatalog', { plan, activity: actividad, selectionMode: true })}
                        activeOpacity={0.88}
                      >
                        <Ionicons
                          name={actividad.servicios.length > 0 ? 'build-outline' : 'add-circle-outline'}
                          size={16}
                          color={actividad.servicios.length > 0 ? '#075985' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.assignButtonText,
                            actividad.servicios.length > 0 && styles.assignButtonTextActive,
                          ]}
                        >
                          {actividad.servicios.length > 0 ? 'Gestionar servicio' : 'Asignar servicio'}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.serviceList}>
                        {actividad.servicios.length === 0 ? (
                          <View style={styles.emptyServiceBox}>
                            <Ionicons name="hourglass-outline" size={15} color="#92400E" />
                            <Text style={styles.emptyInline}>Actividad creada, pero aún sin servicio asignado.</Text>
                          </View>
                        ) : (
                          actividad.servicios.map((servicio) => (
                            <TouchableOpacity
                              key={servicio.id}
                              style={styles.serviceItem}
                              activeOpacity={0.9}
                              onPress={() =>
                                navigation.navigate('ServiceDetail', {
                                  serviceId: servicio.servicio_id || servicio.servicio,
                                  activity: actividad,
                                  assignment: {
                                    ...servicio,
                                    servicio_nombre:
                                      servicio.servicio_nombre ||
                                      catalogoServicios.find((entry) => entry.id === (servicio.servicio_id || servicio.servicio))?.nombre,
                                  },
                                  hideActivityConfirm: true,
                                })
                              }
                            >
                              <View style={styles.serviceIconWrap}>
                                <Ionicons name="briefcase-outline" size={16} color="#0EA5E9" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.serviceName}>
                                  {servicio.servicio_nombre || `Servicio #${servicio.servicio}`}
                                </Text>
                                <Text style={styles.serviceTime}>
                                  {formatDateTimeDisplay(servicio.fecha_inicio)} - {formatDateTimeDisplay(servicio.fecha_fin)}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.statusPill,
                                  servicio.estado === 'confirmado' ? styles.statusConfirmed : styles.statusInterest,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusText,
                                    servicio.estado === 'confirmado' ? styles.statusConfirmedText : styles.statusInterestText,
                                  ]}
                                >
                                  {servicio.estado}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Crear actividad</Text>
                <Text style={styles.modalSubtitle}>Ubícala donde mejor encaje dentro del plan</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalClose} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Input label="Título" value={draft.titulo} onChangeText={(titulo) => setDraft((p) => ({ ...p, titulo }))} />
            <Input
              label="Descripción"
              value={draft.descripcion}
              onChangeText={(descripcion) => setDraft((p) => ({ ...p, descripcion }))}
            />
            <DateTimeField
              label="Inicio"
              placeholder="21/03/2026 10:00"
              value={draft.fecha_inicio}
              onChangeText={(fecha_inicio) => setDraft((p) => ({ ...p, fecha_inicio }))}
            />
            <DateTimeField
              label="Fin"
              placeholder="21/03/2026 12:00"
              value={draft.fecha_fin}
              onChangeText={(fecha_fin) => setDraft((p) => ({ ...p, fecha_fin }))}
            />
            <Button title="Guardar actividad" onPress={createActividad} loading={saving} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  content: { paddingBottom: spacing.xl + 24 },
  hero: {
    backgroundColor: colors.secondary,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: '#CFFAFE',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: spacing.md },
  heroSub: { color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 20 },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.lg,
  },
  summaryToggle: {
    marginTop: spacing.lg,
    minHeight: 46,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(6,182,212,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryToggleText: {
    color: '#ECFEFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 6,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  timelineWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 28,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  timelineHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionSubtitle: { marginTop: 4, color: colors.textSecondary, lineHeight: 19 },
  timelineList: { gap: spacing.sm },
  timelineRow: { flexDirection: 'row', gap: 8 },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 8 },
  dotGap: { backgroundColor: '#38BDF8' },
  line: { width: 2, flex: 1, backgroundColor: '#D8E5EF', marginTop: 6 },
  lineGap: { backgroundColor: '#BAE6FD' },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FCFEFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6EEF5',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  gapCard: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#7DD3FC',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  inlineBadgeGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#E0F2FE',
  },
  inlineBadgeGapText: {
    color: '#0C4A6E',
    fontSize: 12,
    fontWeight: '700',
  },
  gapDuration: {
    color: '#0C4A6E',
    fontSize: 12,
    fontWeight: '700',
  },
  gapWindow: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  gapHint: {
    marginTop: 6,
    color: '#075985',
    lineHeight: 19,
  },
  itemTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  itemMeta: { fontSize: 12.5, color: colors.textSecondary, marginTop: 4 },
  itemText: { color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  assignButton: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CFFAFE',
    backgroundColor: '#F8FDFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  assignButtonActive: {
    backgroundColor: '#ECFEFF',
    borderColor: '#A5F3FC',
  },
  assignButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  assignButtonTextActive: {
    color: '#075985',
  },
  serviceList: { marginTop: spacing.md, gap: spacing.sm },
  emptyServiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    padding: spacing.sm,
  },
  emptyInline: { color: '#92400E', fontSize: 12.5, flex: 1, lineHeight: 18 },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#DCECF7',
    borderRadius: 16,
    padding: spacing.sm,
    backgroundColor: '#F8FBFE',
  },
  serviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  serviceTime: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statusConfirmed: { backgroundColor: '#DCFCE7' },
  statusConfirmedText: { color: '#166534' },
  statusInterest: { backgroundColor: '#E0F2FE' },
  statusInterestText: { color: '#075985' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2,6,23,0.45)' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalSubtitle: { marginTop: 2, color: colors.textSecondary },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
