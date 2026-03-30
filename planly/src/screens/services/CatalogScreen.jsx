import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
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
import { colors, radius, spacing } from '../../theme';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';

const normalizeList = (payload) => (Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []);
const hour = (value) => String(value || '').slice(0, 5);

export default function CatalogScreen({ navigation, route }) {
  const selectionMode = route.params?.selectionMode;
  const plan = route.params?.plan;
  const activity = route.params?.activity;
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async (query = '') => {
    const res = await servicesApi.getCatalogo(query ? { search: query } : {});
    setServicios(normalizeList(res.data));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => [...new Set(servicios.map((item) => item.categoria || 'General'))],
    [servicios]
  );

  const entidadesDestacadas = useMemo(() => {
    const map = new Map();
    servicios.forEach((item) => {
      if (!map.has(item.entidad)) map.set(item.entidad, item);
    });
    return [...map.values()];
  }, [servicios]);

  const summary = useMemo(
    () => [
      { label: 'Servicios', value: servicios.length, icon: 'briefcase-outline' },
      { label: 'Entidades', value: entidadesDestacadas.length, icon: 'storefront-outline' },
      { label: 'Categorías', value: categories.length, icon: 'grid-outline' },
    ],
    [categories.length, entidadesDestacadas.length, servicios.length]
  );

  if (loading) return <Loader />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(search); }} />}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="compass-outline" size={16} color="#67E8F9" />
          <Text style={styles.heroBadgeText}>{selectionMode ? 'Selección guiada' : 'Catálogo curado'}</Text>
        </View>

        <Text style={styles.title}>{selectionMode ? 'Elige el mejor servicio' : 'Descubre servicios con mejor contexto'}</Text>
        <Text style={styles.subtitle}>
          {selectionMode ? `Plan ${plan?.nombre} · ${activity?.titulo}` : 'Explora entidades, compara categorías y encuentra opciones con una vista más clara y visual.'}
        </Text>

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

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            if (text.length === 0 || text.length > 2) load(text);
          }}
          style={styles.searchInput}
          placeholder="Buscar por entidad, servicio o categoría"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Entidades destacadas</Text>
        <Text style={styles.sectionHint}>Toca una entidad para ver su perfil, imágenes y servicios.</Text>
      </View>

      <FlatList
        horizontal
        data={entidadesDestacadas}
        keyExtractor={(item) => `entity-${item.entidad}`}
        contentContainerStyle={styles.horizontalList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('EntityDetail', { entityId: item.entidad, selectionMode, plan, activity })}
          >
            <View style={styles.entityCard}>
              {item.entidad_imagen_principal ? (
                <Image source={{ uri: item.entidad_imagen_principal }} style={styles.entityImage} />
              ) : (
                <View style={[styles.entityImage, styles.entityImageFallback]}>
                  <Ionicons name="storefront-outline" size={28} color={colors.primary} />
                </View>
              )}
              <View style={styles.entityOverlay}>
                <Text style={styles.entityName}>{item.entidad_nombre}</Text>
                <Text style={styles.entityMeta} numberOfLines={1}>{item.entidad_direccion || 'Sin dirección registrada'}</Text>
                <View style={styles.entityStats}>
                  <View style={styles.entityStat}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.entityStatText}>{item.promedio_resenas || 0}</Text>
                  </View>
                  <View style={styles.entityStat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={12} color="#0EA5E9" />
                    <Text style={styles.entityStatText}>{item.total_resenas || 0} reseñas</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {categories.map((category) => {
        const items = servicios.filter((item) => (item.categoria || 'General') === category);
        return (
          <View key={category} style={styles.categoryBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{category}</Text>
              <Text style={styles.sectionHint}>Desliza para comparar opciones de esta categoría.</Text>
            </View>

            <FlatList
              horizontal
              data={items}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.horizontalList}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id, plan, activity, selectionMode })}
                >
                  <View style={styles.serviceCard}>
                    {item.imagen_principal ? (
                      <Image source={{ uri: item.imagen_principal }} style={styles.serviceImage} />
                    ) : (
                      <View style={[styles.serviceImage, styles.serviceImageFallback]}>
                        <Ionicons name="image-outline" size={26} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.serviceBody}>
                      <Text style={styles.serviceName} numberOfLines={1}>{item.nombre}</Text>
                      <Text style={styles.serviceEntity} numberOfLines={1}>{item.entidad_nombre}</Text>
                      <Text style={styles.serviceDesc} numberOfLines={2}>{item.descripcion}</Text>
                      <View style={styles.serviceChips}>
                        <View style={styles.chip}>
                          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.chipText}>{item.lugar}</Text>
                        </View>
                        <View style={styles.chip}>
                          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.chipText}>{hour(item.hora_inicio)}-{hour(item.hora_fin)}</Text>
                        </View>
                      </View>
                      <View style={styles.serviceFooter}>
                        <Text style={styles.price}>S/ {item.precio_actual}</Text>
                        <Text style={styles.score}>★ {item.promedio_resenas || 0}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        );
      })}

      {servicios.length === 0 ? (
        <EmptyState emoji="🔎" title="Sin resultados" subtitle="No encontramos servicios o entidades para mostrar." />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  hero: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(6,182,212,0.22)',
  },
  heroBadgeText: { color: '#ECFEFF', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', lineHeight: 38, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.74)', marginTop: 8, lineHeight: 22, maxWidth: '94%' },
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
  summaryValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11.5, fontWeight: '600' },
  searchWrap: {
    margin: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DCE7F0',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  searchInput: { flex: 1, paddingVertical: 14, marginLeft: spacing.sm, color: colors.text },
  sectionHeader: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionHint: { marginTop: 4, color: colors.textSecondary, fontSize: 12.5 },
  horizontalList: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  entityCard: {
    width: 292,
    height: 188,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#EAF7FC',
    borderWidth: 1,
    borderColor: '#DCECF7',
  },
  entityImage: { width: '100%', height: '100%' },
  entityImageFallback: { alignItems: 'center', justifyContent: 'center' },
  entityOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(15,23,42,0.56)',
  },
  entityName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  entityMeta: { marginTop: 4, color: 'rgba(255,255,255,0.82)', fontSize: 12.5 },
  entityStats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  entityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  entityStatText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
  categoryBlock: { marginBottom: spacing.md },
  serviceCard: {
    width: 282,
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
  serviceImage: { width: '100%', height: 170 },
  serviceImageFallback: { backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' },
  serviceBody: { padding: spacing.md },
  serviceName: { fontWeight: '800', color: colors.text, fontSize: 16 },
  serviceEntity: { color: colors.primary, fontWeight: '700', fontSize: 12.5, marginTop: 4 },
  serviceDesc: { marginTop: 8, color: colors.textSecondary, lineHeight: 18, minHeight: 36 },
  serviceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
  },
  chipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  serviceFooter: { marginTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  score: { color: '#F59E0B', fontWeight: '800' },
});
