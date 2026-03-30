import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../../theme';
import { formatDate } from './finance.helpers';

export default function FinancePlanOverviewScreen({ navigation, route }) {
  const { plan } = route.params;

  const summary = [
    { label: 'Inicio', value: formatDate(plan.fecha_inicio), icon: 'calendar-outline' },
    { label: 'Tipo', value: plan.tipo_plan || 'Plan', icon: 'flag-outline' },
    { label: 'Flujo', value: '2 acciones clave', icon: 'flash-outline' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroBadge}>
          <Ionicons name="wallet-outline" size={16} color="#67E8F9" />
          <Text style={styles.heroBadgeText}>Finanzas del plan</Text>
        </View>

        <Text style={styles.planName}>{plan.nombre}</Text>
        <Text style={styles.planDescription}>{plan.descripcion || 'Aquí puedes registrar movimientos rápidos y revisar el estado financiero del plan.'}</Text>

        <View style={styles.heroMetaRow}>
          {summary.map((item) => (
            <View key={item.label} style={styles.metaCard}>
              <Ionicons name={item.icon} size={16} color={colors.primary} />
              <Text style={styles.metaValue}>{item.value}</Text>
              <Text style={styles.metaLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('FinanceCreateMovement', { plan })}>
          <View style={styles.actionCard}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.success} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Registrar movimiento</Text>
              <Text style={styles.actionText}>Carga gastos, préstamos o pagos con un flujo más rápido y directo.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('FinancePlanSummary', { plan })}>
          <View style={styles.actionCard}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="analytics-outline" size={24} color="#2563EB" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Resumen de cuentas</Text>
              <Text style={styles.actionText}>Revisa movimientos, saldos pendientes y tu lectura financiera del plan.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
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
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
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
  planDescription: { fontSize: 14, color: 'rgba(255,255,255,0.74)', lineHeight: 21, marginTop: 8 },
  heroMetaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metaCard: {
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
  metaValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  metaLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11.5, fontWeight: '600' },
  content: { padding: spacing.lg, gap: spacing.md },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4EDF5',
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  actionText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: 3 },
});
