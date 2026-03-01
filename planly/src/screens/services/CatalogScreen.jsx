import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { servicesApi } from '../../api/services.api';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { colors, spacing, radius } from '../../theme';

export default function CatalogScreen() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async (query = '') => {
    try {
      const params = query ? { search: query } : {};
      const res = await servicesApi.getCatalogo(params);
      setServicios(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length === 0 || text.length >= 3) load(text);
  };

  const renderServicio = ({ item }) => (
    <Card style={styles.servicioCard}>
      <View style={styles.servicioHeader}>
        <View style={styles.servicioIcon}>
          <Ionicons name="star-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.servicioInfo}>
          <Text style={styles.servicioNombre}>{item.nombre}</Text>
          <Text style={styles.servicioEntidad}>{item.entidad_nombre}</Text>
        </View>
        <View style={styles.precioBadge}>
          <Text style={styles.precioText}>S/ {item.precio_actual}</Text>
        </View>
      </View>
      {item.descripcion ? (
        <Text style={styles.servicioDesc} numberOfLines={2}>
          {item.descripcion}
        </Text>
      ) : null}
      <View style={styles.servicioFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.footerText}>{item.lugar}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.footerText}>Máx. {item.capacidad_maxima}</Text>
        </View>
      </View>
    </Card>
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <Text style={styles.headerSubtitle}>Descubre experiencias</Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar actividades, lugares..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); load(); }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {servicios.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Sin resultados"
          subtitle="No encontramos servicios disponibles en este momento"
        />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderServicio}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(search); }}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 46,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  servicioCard: { gap: spacing.sm },
  servicioHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  servicioIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicioInfo: { flex: 1 },
  servicioNombre: { fontSize: 15, fontWeight: '600', color: colors.text },
  servicioEntidad: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  precioBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  precioText: { fontSize: 13, fontWeight: '700', color: '#3A5C00' },
  servicioDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  servicioFooter: { flexDirection: 'row', gap: spacing.md },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: colors.textSecondary },
});