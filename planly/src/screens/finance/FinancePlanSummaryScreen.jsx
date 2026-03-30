import React, { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { financeApi } from '../../api/finance.api';
import { groupsApi } from '../../api/groups.api';
import { useAuthStore } from '../../store/auth.store';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import { colors, spacing, radius } from '../../theme';
import { formatCurrency, formatDate, getPaymentBreakdown, getPlanMovements, normalizeList } from './finance.helpers';

const MOVEMENT_STYLES = {
  gasto_grupal: { color: colors.error, icon: 'people-outline', label: 'Gasto compartido' },
  gasto_individual: { color: '#F97316', icon: 'person-outline', label: 'Gasto personal' },
  prestamo: { color: '#8B5CF6', icon: 'arrow-up-circle-outline', label: 'Préstamo' },
  pago_prestamo: { color: colors.success, icon: 'arrow-down-circle-outline', label: 'Pago' },
  gasto: { color: colors.error, icon: 'receipt-outline', label: 'Gasto' },
};

export default function FinancePlanSummaryScreen({ navigation, route }) {
  const { plan } = route.params;
  const currentUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [participaciones, setParticipaciones] = useState([]);

  const loadSummary = async (pullToRefresh = false) => {
    try {
      if (pullToRefresh) setRefreshing(true);
      else setLoading(true);

      const [movimientosRes, participacionesRes] = await Promise.allSettled([
        financeApi.getMovimientos(),
        groupsApi.getParticipaciones(),
      ]);

      if (movimientosRes.status === 'rejected') throw movimientosRes.reason;

      const allMovimientos = normalizeList(movimientosRes.value.data);
      const allParticipaciones =
        participacionesRes.status === 'fulfilled' ? normalizeList(participacionesRes.value.data) : [];

      setMovimientos(getPlanMovements(plan, allMovimientos));
      setParticipaciones(allParticipaciones);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el resumen financiero del plan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [plan.id])
  );

  const summary = getPaymentBreakdown({
    plan,
    movimientos,
    participaciones,
    currentUserId: currentUser?.id,
  });

  const summaryCards = useMemo(
    () => [
      { label: 'Total movido', value: formatCurrency(summary.total), color: colors.text, icon: 'wallet-outline' },
      { label: 'Te corresponde', value: formatCurrency(summary.myShare), color: colors.primary, icon: 'person-outline' },
      { label: 'Te deben', value: formatCurrency(summary.toReceive), color: colors.success, icon: 'arrow-down-circle-outline' },
      { label: 'Tú debes', value: formatCurrency(summary.toPay), color: colors.error, icon: 'arrow-up-circle-outline' },
    ],
    [summary]
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSummary(true)} colors={[colors.primary]} />}
      >
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('FinanceCreateMovement', { plan })} style={styles.headerAction}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBadge}>
            <Ionicons name="analytics-outline" size={16} color="#67E8F9" />
            <Text style={styles.heroBadgeText}>Resumen de cuentas</Text>
          </View>

          <Text style={styles.planName}>{plan.nombre}</Text>
          <Text style={styles.planMeta}>Inicio {formatDate(plan.fecha_inicio)}</Text>

          <View style={styles.statGrid}>
            {summaryCards.map((item) => (
              <View key={item.label} style={styles.statTile}>
                <Ionicons name={item.icon} size={16} color={item.color} />
                <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Movimientos del plan</Text>
          <Text style={styles.sectionCounter}>{movimientos.length}</Text>
        </View>

        {movimientos.length === 0 ? (
          <EmptyState
            emoji="💸"
            title="Aún no hay movimientos"
            subtitle="Registra el primer gasto de este plan para empezar a calcular cuentas."
            actionLabel="Registrar movimiento"
            onAction={() => navigation.navigate('FinanceCreateMovement', { plan })}
          />
        ) : (
          movimientos
            .slice()
            .sort((a, b) => new Date(b.fecha || b.created_at || 0) - new Date(a.fecha || a.created_at || 0))
            .map((movimiento) => <MovementRow key={`${movimiento.id}`} movimiento={movimiento} />)
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pagos pendientes</Text>
          <Text style={styles.sectionCounter}>{summary.pending.length}</Text>
        </View>

        {summary.pending.length === 0 ? (
          <View style={styles.emptyPendingCard}>
            <Text style={styles.emptyPending}>No hay pagos pendientes para ti en este plan.</Text>
          </View>
        ) : (
          summary.pending.map((item) => (
            <View key={item.id} style={styles.pendingCard}>
              <View style={[styles.pendingIcon, { backgroundColor: item.type === 'receivable' ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons
                  name={item.type === 'receivable' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={20}
                  color={item.type === 'receivable' ? colors.success : colors.error}
                />
              </View>
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingTitle}>{item.title}</Text>
                <Text style={styles.pendingCaption}>{item.caption}</Text>
              </View>
              <Text style={[styles.pendingAmount, { color: item.type === 'receivable' ? colors.success : colors.error }]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function MovementRow({ movimiento }) {
  const config = MOVEMENT_STYLES[movimiento.tipo_movimiento] || MOVEMENT_STYLES.gasto;
  return (
    <View style={styles.movementCard}>
      <View style={[styles.movementIcon, { backgroundColor: `${config.color}18` }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.movementInfo}>
        <Text style={styles.movementTitle}>{movimiento.descripcion || 'Movimiento sin descripción'}</Text>
        <Text style={styles.movementMeta}>{config.label} · {formatDate(movimiento.fecha || movimiento.created_at)}</Text>
      </View>
      <Text style={[styles.movementAmount, { color: config.color }]}>{formatCurrency(movimiento.monto)}</Text>
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
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadge: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(6,182,212,0.22)',
  },
  heroBadgeText: { color: '#ECFEFF', fontSize: 12, fontWeight: '700' },
  planName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: spacing.md },
  planMeta: { color: 'rgba(255,255,255,0.74)', marginTop: 6 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  statTile: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.68)', marginTop: 4 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionCounter: {
    minWidth: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#E2E8F0',
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  movementCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4EDF5',
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  movementIcon: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  movementInfo: { flex: 1 },
  movementTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  movementMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  movementAmount: { fontSize: 15, fontWeight: '800' },
  emptyPendingCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 22,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EDF5',
  },
  emptyPending: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  pendingCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4EDF5',
    padding: spacing.md,
  },
  pendingIcon: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  pendingInfo: { flex: 1 },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  pendingCaption: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  pendingAmount: { fontSize: 14, fontWeight: '800' },
});
