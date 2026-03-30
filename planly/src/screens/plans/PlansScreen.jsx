import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { groupsApi } from '../../api/groups.api';
import { colors, radius, spacing } from '../../theme';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import DateTimeField from '../../components/ui/DateTimeField';
import { formatDateTimeDisplay, toISOFromInput } from '../../utils/datetime';

const normalizeList = (payload) => (Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []);

const getPlanDurationLabel = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff <= 0) return 'Duración por definir';
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} h planificadas`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'día' : 'días'} planificados`;
};

export default function PlansScreen({ navigation }) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });

  const load = async (pull = false) => {
    try {
      pull ? setRefreshing(true) : setLoading(true);
      const res = await groupsApi.getPlanes();
      setPlanes(normalizeList(res.data));
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los planes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const createPlan = async () => {
    if (!draft.nombre || !draft.fecha_inicio || !draft.fecha_fin) {
      Alert.alert('Campos requeridos', 'Completa nombre, inicio y fin.');
      return;
    }

    const fechaInicio = toISOFromInput(draft.fecha_inicio);
    const fechaFin = toISOFromInput(draft.fecha_fin);

    if (!fechaInicio || !fechaFin) {
      Alert.alert('Formato inválido', 'Selecciona una fecha y hora válidas para inicio y fin.');
      return;
    }

    setSaving(true);
    try {
      await groupsApi.createPlan({
        ...draft,
        tipo_plan: 'individual',
        grupo: null,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      setShowModal(false);
      setDraft({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '' });
      load(true);
    } catch {
      Alert.alert('Error', 'No se pudo crear el plan.');
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const now = new Date();
    const proximos = planes.filter((plan) => {
      const start = new Date(plan.fecha_inicio);
      return !Number.isNaN(start.getTime()) && start >= now;
    }).length;

    return [
      { label: 'Planes', value: planes.length, icon: 'albums-outline' },
      { label: 'Próximos', value: proximos, icon: 'sparkles-outline' },
      { label: 'Activos', value: Math.max(planes.length - proximos, 0), icon: 'time-outline' },
    ];
  }, [planes]);

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="calendar-clear-outline" size={16} color="#67E8F9" />
              <Text style={styles.heroBadgeText}>Tus planes</Text>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.88}>
              <Ionicons name="add" size={20} color="#07111F" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Organiza tus planes con más claridad</Text>
          <Text style={styles.subtitle}>
            Visualiza tus próximos bloques de tiempo y entra al timeline de cada plan para afinar actividades y servicios.
          </Text>

          <TouchableOpacity style={styles.summaryToggle} onPress={() => setShowSummary((prev) => !prev)} activeOpacity={0.85}>
            <View style={styles.summaryToggleLeft}>
              <Ionicons name="stats-chart-outline" size={16} color="#CFFAFE" />
              <Text style={styles.summaryToggleText}>{showSummary ? 'Ocultar resumen' : 'Ver resumen'}</Text>
            </View>
            <Ionicons name={showSummary ? 'chevron-up' : 'chevron-down'} size={18} color="#CFFAFE" />
          </TouchableOpacity>

          {showSummary ? (
            <View style={styles.summaryRow}>
              {summary.map((item) => (
                <View key={item.label} style={styles.summaryCard}>
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </LinearGradient>

        {planes.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState
              emoji="🗓️"
              title="Aún no tienes planes"
              subtitle="Crea uno y empieza a construir un timeline más claro y ordenado."
            />
          </View>
        ) : (
          <View style={styles.planList}>
            {planes.map((plan, index) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('PlanTimeline', { plan })}
              >
                <View style={[styles.planCard, index === 0 && styles.featuredPlanCard]}>
                  <View style={styles.planCardTop}>
                    <View style={styles.planIcon}>
                      <Ionicons
                        name={index === 0 ? 'sparkles-outline' : 'calendar-outline'}
                        size={18}
                        color={index === 0 ? '#0891B2' : colors.primary}
                      />
                    </View>

                    <View style={styles.planCopy}>
                      <Text style={styles.planName}>{plan.nombre}</Text>
                      <Text style={styles.planMeta}>
                        {formatDateTimeDisplay(plan.fecha_inicio)} · {getPlanDurationLabel(plan.fecha_inicio, plan.fecha_fin)}
                      </Text>
                    </View>

                    <View style={styles.chevronWrap}>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                  </View>

                  <View style={styles.planTimelineStrip}>
                    <View style={styles.planStripDot} />
                    <View style={styles.planStripLine} />
                    <View style={[styles.planStripDot, styles.planStripDotEnd]} />
                  </View>

                  <Text style={styles.planWindow}>
                    {formatDateTimeDisplay(plan.fecha_inicio)} → {formatDateTimeDisplay(plan.fecha_fin)}
                  </Text>

                  {!!plan.descripcion ? (
                    <Text style={styles.planDesc}>{plan.descripcion}</Text>
                  ) : (
                    <Text style={styles.planHint}>Abre este plan para agregar actividades y detectar espacios libres.</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Nuevo plan</Text>
                <Text style={styles.modalSubtitle}>Define la base del timeline</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalClose} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Input label="Nombre" value={draft.nombre} onChangeText={(nombre) => setDraft((p) => ({ ...p, nombre }))} />
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
            <Button title={saving ? 'Guardando...' : 'Crear plan'} loading={saving} onPress={createPlan} />
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
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBadgeText: {
    color: '#CFFAFE',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
    maxWidth: '92%',
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67E8F9',
  },
  summaryRow: {
    flexDirection: 'row',
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
    flex: 1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
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
  emptyCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF5',
    padding: spacing.md,
  },
  planList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  planCard: {
    borderRadius: 24,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  featuredPlanCard: {
    borderColor: '#BAE6FD',
    backgroundColor: '#FCFEFF',
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCopy: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  planMeta: {
    marginTop: 4,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTimelineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 8,
  },
  planStripDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  planStripDotEnd: {
    backgroundColor: '#22C55E',
  },
  planStripLine: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: '#D8EEF4',
  },
  planWindow: {
    marginTop: 8,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  planDesc: {
    marginTop: 10,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  planHint: {
    marginTop: 10,
    color: '#0891B2',
    lineHeight: 20,
    fontWeight: '600',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2,6,23,0.45)' },
  modalCard: {
    backgroundColor: '#FFFFFF',
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
