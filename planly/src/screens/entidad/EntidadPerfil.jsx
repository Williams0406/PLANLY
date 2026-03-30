import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEntidadStore } from '../../store/entidad.store';
import { useAuthStore } from '../../store/auth.store';
import Card from '../../components/ui/Card';
import { colors, spacing, radius } from '../../theme';

const PURPLE = '#8B5CF6';

export default function EntidadPerfil() {
  const { perfil, servicios } = useEntidadStore();
  const { logout } = useAuthStore();

  const INFO_ROWS = [
    { icon: 'storefront-outline', label: 'Nombre comercial', value: perfil?.nombre_comercial },
    { icon: 'card-outline', label: 'RUC', value: perfil?.ruc || 'No registrado' },
    { icon: 'location-outline', label: 'Dirección', value: perfil?.direccion },
    { icon: 'person-outline', label: 'Contacto', value: perfil?.contacto_referencia },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {perfil?.nombre_comercial?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.nombre}>{perfil?.nombre_comercial}</Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.verifiedText}>Entidad verificada</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: PURPLE }]}>
              {servicios.length}
            </Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {servicios.filter((s) => s.activo).length}
            </Text>
            <Text style={styles.statLabel}>Activos</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {servicios.filter((s) => s.tiene_promocion).length}
            </Text>
            <Text style={styles.statLabel}>Promos</Text>
          </Card>
        </View>

        {/* Info */}
        <Card style={styles.infoCard} padded={false}>
          <View style={styles.infoHeader}>
            <Ionicons name="business-outline" size={16} color={PURPLE} />
            <Text style={[styles.infoHeaderText, { color: PURPLE }]}>
              Información empresarial
            </Text>
          </View>
          {INFO_ROWS.map((row, i) => (
            <View
              key={i}
              style={[
                styles.infoRow,
                i < INFO_ROWS.length - 1 && styles.infoRowBorder,
              ]}
            >
              <View style={styles.infoIconWrap}>
                <Ionicons name={row.icon} size={16} color={PURPLE} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value || '-'}</Text>
              </View>
            </View>
          ))}
        </Card>

        {!!perfil?.imagenes_promocionales?.length && (
          <Card>
            <Text style={styles.infoHeaderText}>Galería promocional</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
              {perfil.imagenes_promocionales.map((uri, idx) => (
                <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.promoImage} />
              ))}
            </ScrollView>
          </Card>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Planly Business v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: '#1E1B4B',
    paddingTop: 56, paddingBottom: spacing.xl,
    alignItems: 'center', gap: spacing.xs,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: PURPLE,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  nombre: { fontSize: 20, fontWeight: '700', color: '#fff' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full,
  },
  verifiedText: { fontSize: 12, fontWeight: '600', color: colors.success },
  content: { padding: spacing.lg, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  infoCard: { overflow: 'hidden' },
  infoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: spacing.md,
    backgroundColor: PURPLE + '08',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoHeaderText: { fontSize: 13, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.md,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: PURPLE + '10',
    justifyContent: 'center', alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500', color: colors.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: '#FEF2F2',
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
  version: { textAlign: 'center', fontSize: 12, color: colors.textSecondary },
  promoImage: { width: 160, height: 100, borderRadius: radius.md },
});