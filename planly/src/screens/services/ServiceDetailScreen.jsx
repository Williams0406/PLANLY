import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { servicesApi } from '../../api/services.api';
import { groupsApi } from '../../api/groups.api';
import { colors, radius, spacing } from '../../theme';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import RatingSelector from '../../components/ui/RatingSelector';
import { formatDateTimeDisplay } from '../../utils/datetime';

const formatSchedule = (horario) =>
  `${formatDateTimeDisplay(horario.fecha_inicio)} - ${formatDateTimeDisplay(horario.fecha_fin)}`;

const isScheduleInsideActivity = (horario, actividad) => {
  if (!horario || !actividad) return false;
  const horarioInicio = new Date(horario.fecha_inicio).getTime();
  const horarioFin = new Date(horario.fecha_fin).getTime();
  const actividadInicio = new Date(actividad.fecha_inicio).getTime();
  const actividadFin = new Date(actividad.fecha_fin).getTime();
  return horarioInicio >= actividadInicio && horarioFin <= actividadFin;
};

const normalizeSchedules = (service) => {
  if (service?.horarios?.length) return service.horarios;
  return [];
};

const buildGallery = (service) => {
  const images = [];
  if (service?.imagen_principal) images.push(service.imagen_principal);
  (service?.imagenes || []).forEach((uri) => {
    if (uri && !images.includes(uri)) images.push(uri);
  });
  return images;
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { serviceId, activity, assignment: assignmentParam, hideActivityConfirm, selectionMode, plan } = route.params || {};
  const [service, setService] = useState(null);
  const [assignment, setAssignment] = useState(assignmentParam || null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedHorarioIndex, setSelectedHorarioIndex] = useState(0);
  const [review, setReview] = useState({ puntaje: 5, comentario: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await servicesApi.getServicio(serviceId);
      setService(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [serviceId]);

  useEffect(() => {
    setAssignment(assignmentParam || null);
  }, [assignmentParam]);

  const horarios = useMemo(() => normalizeSchedules(service), [service]);
  const selectedHorario = horarios[selectedHorarioIndex] || null;
  const gallery = useMemo(() => buildGallery(service), [service]);

  const summary = useMemo(
    () => [
      { label: 'Precio', value: `S/ ${service?.precio_actual || 0}`, icon: 'pricetag-outline' },
      { label: 'Reseñas', value: service?.total_resenas || 0, icon: 'chatbubble-ellipses-outline' },
      { label: 'Puntaje', value: service?.promedio_resenas || 0, icon: 'star-outline' },
    ],
    [service]
  );

  const assignServiceToActivity = async (actividadObjetivo) => {
    if (!service) return;
    if (!selectedHorario) {
      Alert.alert('Sin horario', 'Este servicio no tiene un horario seleccionable.');
      return;
    }
    if (!isScheduleInsideActivity(selectedHorario, actividadObjetivo)) {
      Alert.alert('Horario incompatible', 'El horario elegido debe estar dentro del rango de la actividad.');
      return;
    }

    setAssigning(true);
    try {
      await groupsApi.createAsignacionServicio({
        actividad: actividadObjetivo.id,
        servicio: service.id,
        fecha_inicio: selectedHorario.fecha_inicio,
        fecha_fin: selectedHorario.fecha_fin,
      });
      setShowActivityModal(false);
      Alert.alert('Solicitud enviada', `El servicio se asignó a "${actividadObjetivo.titulo}" con estado interés.`);
      navigation.goBack();
    } catch (error) {
      const msg = error.response?.data
        ? Object.values(error.response.data).flat().join('\n')
        : 'No se pudo enviar la solicitud.';
      Alert.alert('Error', msg);
    } finally {
      setAssigning(false);
    }
  };

  const openCompatibleActivities = async () => {
    if (!selectedHorario) {
      Alert.alert('Sin horario', 'Selecciona primero uno de los horarios del servicio.');
      return;
    }

    setActivitiesLoading(true);
    try {
      const res = await groupsApi.getActividades();
      const compatibles = (res.data || []).filter((item) => isScheduleInsideActivity(selectedHorario, item));
      setAvailableActivities(compatibles);
      setShowActivityModal(true);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las actividades.');
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleConfirmForActivity = async () => {
    if (activity) {
      await assignServiceToActivity(activity);
      return;
    }
    await openCompatibleActivities();
  };

  const handleCancelar = async () => {
    if (!assignment?.id) return;
    setAssigning(true);
    try {
      await groupsApi.cancelarAsignacionServicio(assignment.id);
      setAssignment((prev) => ({ ...prev, estado: 'cancelado' }));
      Alert.alert('Servicio cancelado', 'La asignación pasó a estado cancelado.');
    } catch (error) {
      const msg = error.response?.data
        ? Object.values(error.response.data).flat().join('\n')
        : 'No se pudo cancelar el servicio.';
      Alert.alert('Error', msg);
    } finally {
      setAssigning(false);
    }
  };

  const handlePagar = async () => {
    if (!assignment?.id) return;
    setAssigning(true);
    try {
      const response = await groupsApi.confirmarPagoServicio(assignment.id);
      setAssignment((prev) => ({
        ...prev,
        estado: 'confirmado',
        movimiento_pago: response.data?.movimiento_id || prev?.movimiento_pago,
      }));
      Alert.alert(
        'Servicio confirmado',
        `Se registró un ${response.data?.tipo_movimiento || 'gasto_grupal'} por S/ ${response.data?.monto || service?.precio_actual}.`
      );
    } catch (error) {
      const msg = error.response?.data
        ? Object.values(error.response.data).flat().join('\n')
        : 'No se pudo confirmar el pago.';
      Alert.alert('Error', msg);
    } finally {
      setAssigning(false);
    }
  };

  const submitReview = async () => {
    try {
      await servicesApi.crearResenaServicio({
        servicio: service.id,
        puntaje: review.puntaje,
        comentario: review.comentario,
      });
      setReview({ puntaje: 5, comentario: '' });
      await load();
      Alert.alert('Listo', 'Tu reseña del servicio fue enviada.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la reseña.');
    }
  };

  if (loading) return <Loader />;
  if (!service) return null;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Ionicons name="briefcase-outline" size={16} color="#67E8F9" />
            <Text style={styles.heroBadgeText}>{service.categoria}</Text>
          </View>

          <Text style={styles.title}>{service.nombre}</Text>
          <Text style={styles.subtitle}>{service.entidad_nombre}</Text>

          <View style={styles.summaryRow}>
            {summary.map((item) => (
              <View key={item.label} style={styles.summaryCard}>
                <Ionicons name={item.icon} size={16} color={colors.primary} />
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {gallery.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {gallery.map((uri, idx) => (
              <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.primaryBlock}>
          <View style={styles.primaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.price}>S/ {service.precio_actual}</Text>
              <Text style={styles.score}>★ {service.promedio_resenas || 0} · {service.total_resenas || 0} reseñas</Text>
            </View>
            <TouchableOpacity
              style={styles.entityLink}
              onPress={() => navigation.navigate('EntityDetail', { entityId: service.entidad, selectionMode, plan, activity })}
            >
              <Ionicons name="storefront-outline" size={16} color={colors.primary} />
              <Text style={styles.entityLinkText}>Ver entidad</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.body}>{service.descripcion}</Text>

          <View style={styles.infoChips}>
            <View style={styles.chip}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.chipText}>{service.lugar}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="wallet-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.chipText}>{service.modalidad_pago_label || 'Pago completo'}</Text>
            </View>
          </View>

          {service.forma_pago_resumen ? <Text style={styles.helperText}>{service.forma_pago_resumen}</Text> : null}

          {horarios.length > 0 ? (
            <View style={styles.scheduleList}>
              <Text style={styles.sectionInlineTitle}>Elige un horario</Text>
              <Text style={styles.sectionInlineHint}>Selecciona el bloque que quieres usar al asignar el servicio.</Text>
              {horarios.map((horario, index) => {
                const selected = index === selectedHorarioIndex;
                return (
                  <TouchableOpacity
                    key={`${horario.fecha_inicio}-${index}`}
                    style={[styles.scheduleOption, selected && styles.scheduleOptionActive]}
                    onPress={() => setSelectedHorarioIndex(index)}
                    disabled={!!assignment}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scheduleTitle, selected && styles.scheduleTitleActive]}>Horario {index + 1}</Text>
                      <Text style={[styles.scheduleSubtext, selected && styles.scheduleTitleActive]}>{formatSchedule(horario)}</Text>
                    </View>
                    <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? colors.primary : colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.helperText}>
              Horario: {String(service.hora_inicio || '').slice(0, 5)} - {String(service.hora_fin || '').slice(0, 5)}
            </Text>
          )}

          {assignment ? (
            <>
              <Text style={styles.helperText}>Actividad: {activity?.titulo || 'Asignación existente'}</Text>
              <Text style={styles.helperText}>Estado actual: {assignment.estado}</Text>
              <View style={styles.actionRow}>
                <Button title="Cancelar" variant="outline" onPress={handleCancelar} loading={assigning} style={styles.inlineButton} />
                <Button title="Pagar" onPress={handlePagar} loading={assigning} style={styles.inlineButton} />
              </View>
            </>
          ) : (
            <>
              {activity ? (
                <Text style={styles.helperText}>La asignación solo avanzará si el horario elegido entra dentro del tiempo de la actividad.</Text>
              ) : (
                <Text style={styles.helperText}>Primero eliges el horario y luego te mostramos actividades compatibles.</Text>
              )}
              {!hideActivityConfirm ? (
                <Button
                  title={activitiesLoading ? 'Buscando actividades...' : 'Confirmar para actividad'}
                  onPress={handleConfirmForActivity}
                  loading={assigning || activitiesLoading}
                  style={{ marginTop: spacing.md }}
                />
              ) : null}
            </>
          )}
        </View>

        <View style={styles.reviewComposer}>
          <Text style={styles.sectionTitle}>Califica este servicio</Text>
          <Text style={styles.sectionInlineHint}>Selecciona estrellas en lugar de escribir el puntaje manualmente.</Text>
          <RatingSelector value={review.puntaje} onChange={(puntaje) => setReview((prev) => ({ ...prev, puntaje }))} />
          <TextInput
            style={styles.textarea}
            multiline
            value={review.comentario}
            onChangeText={(comentario) => setReview((prev) => ({ ...prev, comentario }))}
            placeholder="Comparte cómo fue el servicio, puntualidad, calidad, atención..."
            textAlignVertical="top"
          />
          <Button title="Enviar reseña del servicio" onPress={submitReview} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Opiniones del servicio</Text>
        </View>
        {(service.resenas || []).map((item) => (
          <View key={item.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewAuthor}>{item.usuario_nombre}</Text>
              <Text style={styles.reviewScore}>★ {item.puntaje}</Text>
            </View>
            <Text style={styles.reviewText}>{item.comentario || 'Sin comentario.'}</Text>
          </View>
        ))}
      </ScrollView>

      <ActivityPickerModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        activities={availableActivities}
        selectedHorario={selectedHorario}
        onSelect={assignServiceToActivity}
        loading={assigning}
      />
    </>
  );
}

function ActivityPickerModal({ visible, onClose, activities, selectedHorario, onSelect, loading }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Elegir actividad</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedHorario ? <Text style={styles.modalSubtitle}>Horario elegido: {formatSchedule(selectedHorario)}</Text> : null}

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {activities.length === 0 ? (
              <Text style={styles.emptyState}>No hay actividades cuya ventana incluya el horario seleccionado.</Text>
            ) : (
              activities.map((item) => (
                <TouchableOpacity key={item.id} style={styles.activityOption} onPress={() => onSelect(item)} disabled={loading}>
                  <Text style={styles.activityTitle}>{item.titulo}</Text>
                  <Text style={styles.activityMeta}>
                    {formatDateTimeDisplay(item.fecha_inicio)} - {formatDateTimeDisplay(item.fecha_fin)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(6,182,212,0.22)',
    alignItems: 'center',
  },
  heroBadgeText: { color: '#ECFEFF', fontWeight: '700', fontSize: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.78)', marginTop: 6 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11.5, fontWeight: '600', textAlign: 'center' },
  gallery: { padding: spacing.lg, gap: spacing.sm },
  image: { width: 260, height: 174, borderRadius: 24 },
  primaryBlock: {
    marginHorizontal: spacing.lg,
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
  primaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  price: { color: colors.primary, fontSize: 28, fontWeight: '800' },
  score: { color: '#F59E0B', fontWeight: '700', marginTop: 4 },
  entityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: '#ECFEFF',
  },
  entityLinkText: { color: colors.primary, fontWeight: '700' },
  body: { color: colors.text, marginTop: spacing.md, lineHeight: 22 },
  infoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
  },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  helperText: { fontSize: 12.5, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  sectionInlineTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sectionInlineHint: { fontSize: 12.5, color: colors.textSecondary, marginBottom: spacing.sm },
  scheduleList: { marginTop: spacing.md, gap: spacing.sm },
  scheduleOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduleOptionActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  scheduleTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  scheduleSubtext: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scheduleTitleActive: { color: colors.primary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  inlineButton: { flex: 1 },
  reviewComposer: {
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
  sectionHeader: { marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  textarea: {
    marginTop: spacing.sm,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#fff',
    marginBottom: spacing.md,
  },
  reviewCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EDF5',
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: colors.text },
  reviewScore: { color: '#F59E0B', fontWeight: '800' },
  reviewText: { color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs },
  emptyState: { fontSize: 13, color: colors.textSecondary, paddingVertical: spacing.md },
  activityOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  activityTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  activityMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
