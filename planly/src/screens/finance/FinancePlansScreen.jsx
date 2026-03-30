import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { groupsApi } from '../../api/groups.api';
import { colors, spacing, radius } from '../../theme';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { normalizeList, formatDate } from './finance.helpers';

export default function FinancePlansScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planes, setPlanes] = useState([]);

  const loadPlans = async (pullToRefresh = false) => {
    try {
      if (pullToRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await groupsApi.getPlanes();
      const data = normalizeList(response.data).sort(
        (a, b) => new Date(b.fecha_inicio || b.created_at || 0) - new Date(a.fecha_inicio || a.created_at || 0)
      );
      setPlanes(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  const summary = useMemo(
    () => [
      { label: 'Planes', value: planes.length, icon: 'albums-outline' },
      { label: 'Con finanzas', value: planes.length, icon: 'wallet-outline' },
      { label: 'Listos para revisar', value: planes.length > 0 ? 1 : 0, icon: 'analytics-outline' },
    ],
    [planes.length]
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={planes}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
            <View style={styles.heroBadge}>
              <Ionicons name="wallet-outline" size={16} color="#67E8F9" />
              <Text style={styles.heroBadgeText}>Finanzas por plan</Text>
            </View>

            <Text style={styles.title}>Elige el plan que quieres revisar</Text>
            <Text style={styles.subtitle}>Desde aquí entras a registrar movimientos o revisar cuentas sin perder contexto.</Text>

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
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              emoji="🧾"
              title="Aún no tienes planes"
              subtitle="Cuando tengas un plan, aquí podrás registrar gastos y revisar saldos."
            />
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPlans(true)} colors={[colors.primary]} />}
        renderItem={({ item, index }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('FinancePlanOverview', { plan: item })}>
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: `${AVATAR_COLORS[index % AVATAR_COLORS.length]}20` }]}>
                <Text style={[styles.avatarText, { color: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                  {item.nombre?.charAt(0)?.toUpperCase() || 'P'}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.nombre}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.descripcion || 'Sin descripción del plan.'}</Text>
                <Text style={styles.meta}>Inicio: {formatDate(item.fecha_inicio)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const AVATAR_COLORS = [colors.primary, '#8B5CF6', '#F97316', '#84CC16'];

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
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: spacing.md },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: spacing.xs, lineHeight: 20 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
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
  summaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11.5, fontWeight: '600', textAlign: 'center' },
  list: { paddingBottom: spacing.xl + 24, gap: spacing.sm },
  emptyWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EDF5',
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  avatar: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  description: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },
});
