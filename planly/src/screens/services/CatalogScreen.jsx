import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { servicesApi } from '../../api/services.api';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const toHour = (v) => (v ? String(v).slice(0, 5) : '--:--');

export default function CatalogScreen() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  const [selectedServicio, setSelectedServicio] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showEmpresaInfo, setShowEmpresaInfo] = useState(false);

  const load = async (query = '') => {
    try {
      setLoadError('');
      const params = query ? { search: query } : {};
      const res = await servicesApi.getCatalogo(params);
      setServicios(normalizeList(res.data));
    } catch (e) {
      setServicios([]);
      const msg = e?.response?.data?.detail || 'No se pudo cargar el catálogo de servicios';
      setLoadError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length === 0 || text.length >= 3) load(text);
  };

  const openServiceDetail = async (item) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setShowEmpresaInfo(false);
    try {
      const res = await servicesApi.getServicio(item.id);
      setSelectedServicio(res.data);
    } catch (e) {
      setSelectedServicio(item);
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderServicio = ({ item }) => (
    <TouchableOpacity activeOpacity={0.85} onPress={() => openServiceDetail(item)}>
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
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.footerText}>
              {toHour(item.hora_inicio)} - {toHour(item.hora_fin)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <Text style={styles.headerSubtitle}>Descubre experiencias</Text>
      </View>

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
          <TouchableOpacity
            onPress={() => {
              setSearch('');
              load();
            }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {servicios.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title={loadError ? 'No se pudo cargar servicios' : 'Sin resultados'}
          subtitle={
            loadError
              ? `${loadError}. Verifica también que existan servicios activos con entidades aprobadas.`
              : 'No encontramos servicios disponibles en este momento'
          }
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
              onRefresh={() => {
                setRefreshing(true);
                load(search);
              }}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del servicio</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <Loader />
            ) : !selectedServicio ? (
              <EmptyState emoji="⚠️" title="Sin información" subtitle="No se pudo cargar el detalle" />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailName}>{selectedServicio.nombre}</Text>
                <Text style={styles.detailPrice}>S/ {selectedServicio.precio_actual}</Text>
                {!!selectedServicio.descripcion && (
                  <Text style={styles.detailDesc}>{selectedServicio.descripcion}</Text>
                )}

                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>Disponibilidad</Text>
                  <Text style={styles.infoLine}>
                    Horario: {toHour(selectedServicio.hora_inicio)} - {toHour(selectedServicio.hora_fin)}
                  </Text>
                  <Text style={styles.infoLine}>Lugar: {selectedServicio.lugar || 'No especificado'}</Text>
                  <Text style={styles.infoLine}>Capacidad: {selectedServicio.capacidad_maxima || '-'} personas</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>Empresa</Text>
                  <Text style={styles.infoLine}>{selectedServicio.entidad_nombre || 'Sin empresa'}</Text>
                  <Button
                    title={showEmpresaInfo ? 'Ocultar info de empresa' : 'Ver más información de la empresa'}
                    variant="outline"
                    onPress={() => setShowEmpresaInfo((v) => !v)}
                    style={styles.companyBtn}
                  />

                  {showEmpresaInfo && (
                    <View style={styles.companyDetails}>
                      <Text style={styles.infoLine}>
                        Dirección: {selectedServicio.entidad_direccion || 'No disponible'}
                      </Text>
                      <Text style={styles.infoLine}>
                        Contacto: {selectedServicio.entidad_contacto_referencia || selectedServicio.entidad_contacto || 'No disponible'}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  detailName: { fontSize: 20, fontWeight: '800', color: colors.text },
  detailPrice: { marginTop: 4, fontSize: 16, fontWeight: '700', color: colors.primary },
  detailDesc: { marginTop: spacing.sm, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  infoBox: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  infoLine: { fontSize: 13, color: colors.textSecondary },
  companyBtn: { marginTop: spacing.sm },
  companyDetails: { marginTop: spacing.sm, gap: 4 },
});