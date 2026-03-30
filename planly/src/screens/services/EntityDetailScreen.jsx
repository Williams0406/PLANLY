import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import RatingSelector from '../../components/ui/RatingSelector';
import { colors, radius, spacing } from '../../theme';

const normalizeByCategory = (items = []) => {
  const grouped = new Map();
  items.forEach((item) => {
    const key = item.categoria || 'General';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  });
  return [...grouped.entries()];
};

const hour = (value) => String(value || '').slice(0, 5);

export default function EntityDetailScreen({ route, navigation }) {
  const { entityId, selectionMode, plan, activity } = route.params || {};
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState({ puntaje: 5, comentario: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await servicesApi.getEntidad(entityId);
      setEntity(res.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la entidad.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [entityId]);

  const servicesByCategory = useMemo(() => normalizeByCategory(entity?.servicios), [entity]);

  const summary = useMemo(
    () => [
      { label: 'Servicios', value: entity?.servicios?.length || 0, icon: 'briefcase-outline' },
      { label: 'Reseñas', value: entity?.total_resenas || 0, icon: 'chatbubble-ellipses-outline' },
      { label: 'Puntaje', value: entity?.promedio_resenas || 0, icon: 'star-outline' },
    ],
    [entity]
  );

  const submitReview = async () => {
    setSubmitting(true);
    try {
      await servicesApi.crearResenaEntidad({
        entidad: entity.id,
        puntaje: review.puntaje,
        comentario: review.comentario,
      });
      setReview({ puntaje: 5, comentario: '' });
      await load();
      Alert.alert('Listo', 'Tu reseña de la entidad fue enviada.');
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join('\n')
        : 'No se pudo guardar la reseña.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!entity) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroBadge}>
          <Ionicons name="storefront-outline" size={16} color="#67E8F9" />
          <Text style={styles.heroBadgeText}>Entidad destacada</Text>
        </View>

        <Text style={styles.title}>{entity.nombre_comercial}</Text>
        <Text style={styles.subtitle}>{entity.direccion}</Text>

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

      {(entity.imagenes_promocionales || []).length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {entity.imagenes_promocionales.map((uri, index) => (
            <Image key={`${uri}-${index}`} source={{ uri }} style={styles.image} />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.infoBlock}>
        <Text style={styles.sectionTitle}>Sobre la entidad</Text>
        <Text style={styles.body}>Contacto: {entity.contacto_referencia}</Text>
        {!!entity.ruc ? <Text style={styles.meta}>RUC: {entity.ruc}</Text> : null}
        <Text style={styles.meta}>{entity.servicios?.length || 0} servicios publicados</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Servicios por categoría</Text>
        <Text style={styles.sectionHint}>Toca una tarjeta para ver el detalle del servicio.</Text>
      </View>

      {servicesByCategory.map(([category, items]) => (
        <View key={category} style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id, selectionMode, plan, activity })}
              >
                <View style={styles.serviceCard}>
                  {item.imagen_principal ? (
                    <Image source={{ uri: item.imagen_principal }} style={styles.serviceImage} />
                  ) : (
                    <View style={[styles.serviceImage, styles.serviceFallback]}>
                      <Ionicons name="image-outline" size={26} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.serviceBody}>
                    <Text style={styles.serviceName}>{item.nombre}</Text>
                    <Text style={styles.serviceMeta} numberOfLines={2}>{item.descripcion}</Text>
                    <View style={styles.chipsRow}>
                      <View style={styles.infoChip}>
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.infoChipText}>{item.lugar}</Text>
                      </View>
                      <View style={styles.infoChip}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.infoChipText}>{hour(item.hora_inicio)} - {hour(item.hora_fin)}</Text>
                      </View>
                    </View>
                    <View style={styles.serviceFooter}>
                      <Text style={styles.price}>S/ {item.precio_actual}</Text>
                      <Text style={styles.serviceRating}>★ {item.promedio_resenas || 0}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}

      <View style={styles.reviewComposer}>
        <Text style={styles.sectionTitle}>Deja tu reseña</Text>
        <Text style={styles.sectionHint}>Valora la experiencia y ayuda a otros a decidir mejor.</Text>
        <RatingSelector value={review.puntaje} onChange={(puntaje) => setReview((prev) => ({ ...prev, puntaje }))} />
        <TextInput
          style={styles.textarea}
          multiline
          value={review.comentario}
          onChangeText={(comentario) => setReview((prev) => ({ ...prev, comentario }))}
          placeholder="Comparte lo mejor de esta entidad, atención, puntualidad, ambiente..."
          textAlignVertical="top"
        />
        <Button title="Enviar reseña de la entidad" onPress={submitReview} loading={submitting} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Opiniones recientes</Text>
      </View>
      {(entity.resenas || []).map((item) => (
        <View key={item.id} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <Text style={styles.reviewAuthor}>{item.usuario_nombre}</Text>
            <Text style={styles.reviewScore}>★ {item.puntaje}</Text>
          </View>
          <Text style={styles.reviewText}>{item.comentario || 'Sin comentario.'}</Text>
        </View>
      ))}
    </ScrollView>
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
  subtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 6, lineHeight: 20 },
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
  summaryValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11.5, fontWeight: '600' },
  gallery: { padding: spacing.lg, gap: spacing.sm },
  image: { width: 260, height: 174, borderRadius: 24 },
  infoBlock: {
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
  sectionHeader: { marginTop: spacing.lg, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionHint: { marginTop: 4, fontSize: 12.5, color: colors.textSecondary },
  body: { color: colors.text, fontSize: 14 },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
  categoryBlock: { marginBottom: spacing.lg },
  categoryTitle: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, fontSize: 15, fontWeight: '800', color: colors.text },
  horizontalList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  serviceCard: {
    width: 268,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EDF5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  serviceImage: { width: '100%', height: 156 },
  serviceFallback: { backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' },
  serviceBody: { padding: spacing.md },
  serviceName: { fontSize: 15, fontWeight: '800', color: colors.text },
  serviceMeta: { marginTop: 6, color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
  },
  infoChipText: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '600' },
  serviceFooter: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  serviceRating: { color: colors.textSecondary, fontWeight: '700' },
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
});
