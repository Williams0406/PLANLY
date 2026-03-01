import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, StatusBar, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useEntidadStore } from '../../store/entidad.store';
import { useAuthStore } from '../../store/auth.store';
import Card from '../../components/ui/Card';
import { colors, spacing, radius } from '../../theme';

const PURPLE = '#8B5CF6';

export default function EntidadDashboard({ navigation }) {
  const { perfil, servicios, fetchServicios } = useEntidadStore();
  const { logout } = useAuthStore();

  useFocusEffect(
    useCallback(() => { fetchServicios(); }, [])
  );

  const activos = servicios.filter((s) => s.activo).length;
  const conPromocion = servicios.filter((s) => s.tiene_promocion).length;
  const totalServicios = servicios.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header empresarial */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Panel Empresarial</Text>
            <Text style={styles.empresa}>{perfil?.nombre_comercial}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Badge de aprobación */}
        <View style={styles.approvedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.approvedText}>Cuenta verificada y activa</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchServicios}
            colors={[PURPLE]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="briefcase"
            label="Total servicios"
            value={totalServicios}
            color={PURPLE}
          />
          <StatCard
            icon="checkmark-circle"
            label="Activos"
            value={activos}
            color={colors.success}
          />
          <StatCard
            icon="pricetag"
            label="En promoción"
            value={conPromocion}
            color={colors.warning}
          />
          <StatCard
            icon="star"
            label="Rating"
            value="N/A"
            color={colors.primary}
          />
        </View>

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="add-circle"
            label="Nuevo servicio"
            color={PURPLE}
            onPress={() =>
              navigation.navigate('Servicios', {
                screen: 'CrearServicio',
              })
            }
          />
          <QuickAction
            icon="list"
            label="Mis servicios"
            color={colors.primary}
            onPress={() => navigation.navigate('Servicios')}
          />
          <QuickAction
            icon="business"
            label="Mi perfil"
            color={colors.accent}
            onPress={() => navigation.navigate('PerfilTab')}
          />
          <QuickAction
            icon="stats-chart"
            label="Estadísticas"
            color={colors.success}
            onPress={() => {}}
          />
        </View>

        {/* Servicios recientes */}
        <Text style={styles.sectionTitle}>Servicios recientes</Text>
        {servicios.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Sin servicios aún</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primer servicio para aparecer en el catálogo
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: PURPLE }]}
              onPress={() =>
                navigation.navigate('Servicios', { screen: 'CrearServicio' })
              }
            >
              <Text style={styles.emptyBtnText}>Crear servicio</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          servicios.slice(0, 3).map((s) => (
            <MiniServicioCard key={s.id} servicio={s} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function MiniServicioCard({ servicio }) {
  return (
    <Card style={styles.miniCard}>
      <View style={styles.miniRow}>
        <View style={styles.miniIcon}>
          <Ionicons name="briefcase-outline" size={18} color={PURPLE} />
        </View>
        <View style={styles.miniInfo}>
          <Text style={styles.miniNombre}>{servicio.nombre}</Text>
          <Text style={styles.miniLugar}>{servicio.lugar}</Text>
        </View>
        <View style={styles.miniRight}>
          <Text style={styles.miniPrecio}>S/ {servicio.costo_regular}</Text>
          <View style={[
            styles.miniBadge,
            { backgroundColor: servicio.activo ? '#DCFCE7' : '#FEE2E2' },
          ]}>
            <Text style={[
              styles.miniBadgeText,
              { color: servicio.activo ? '#166534' : '#991B1B' },
            ]}>
              {servicio.activo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: '#1E1B4B',
    paddingTop: 56,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
  empresa: { fontSize: 22, fontWeight: '800', color: '#fff' },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  approvedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.full,
  },
  approvedText: { fontSize: 12, fontWeight: '600', color: colors.success },
  content: { padding: spacing.lg, gap: spacing.lg },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  statCard: {
    width: '47%', alignItems: 'center',
    gap: 6, paddingVertical: spacing.md,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  quickAction: {
    width: '47%', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  quickIcon: {
    width: 48, height: 48, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    marginTop: spacing.sm, paddingHorizontal: spacing.xl,
    paddingVertical: 12, borderRadius: radius.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  miniCard: { marginBottom: 2 },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  miniIcon: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: PURPLE + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  miniInfo: { flex: 1 },
  miniNombre: { fontSize: 14, fontWeight: '600', color: colors.text },
  miniLugar: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  miniRight: { alignItems: 'flex-end', gap: 4 },
  miniPrecio: { fontSize: 14, fontWeight: '700', color: PURPLE },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  miniBadgeText: { fontSize: 10, fontWeight: '600' },
});