import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useGroupsStore } from '../../store/groups.store';
import { useFinanceStore } from '../../store/finance.store';
import Card from '../../components/ui/Card';
import { colors, spacing, radius } from '../../theme';

const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Mi perfil', key: 'perfil' },
  { icon: 'notifications-outline', label: 'Notificaciones', key: 'notif' },
  { icon: 'shield-checkmark-outline', label: 'Privacidad', key: 'privacidad' },
  { icon: 'help-circle-outline', label: 'Ayuda', key: 'ayuda' },
];

export default function ProfileScreen() {
  const { user, logout, fetchMe } = useAuthStore();
  const { grupos, fetchGrupos } = useGroupsStore();
  const { balance, fetchBalance } = useFinanceStore();

  useFocusEffect(
    useCallback(() => {
      fetchMe();
      fetchGrupos();
      fetchBalance();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.username}>
          {user?.nombres
            ? `${user.nombres} ${user.apellidos}`
            : user?.username || 'Mi cuenta'}
        </Text>
        <Text style={styles.email}>{user?.ocupacion || 'Usuario Planly'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats rápidos */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{grupos.length}</Text>
            <Text style={styles.statLabel}>Grupos</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: balance?.balance >= 0 ? colors.success : colors.error }]}>
              {balance ? `S/${Number(balance.balance).toFixed(0)}` : '-'}
            </Text>
            <Text style={styles.statLabel}>Balance</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>🌟</Text>
            <Text style={styles.statLabel}>Activo</Text>
          </Card>
        </View>

        {/* Menú */}
        <Card style={styles.menuCard} padded={false}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Card>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Planly v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.secondary,
    paddingTop: 56,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.sm,
  },
  username: { fontSize: 20, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  content: { padding: spacing.lg, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  menuCard: { overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
  version: { textAlign: 'center', fontSize: 12, color: colors.textSecondary },
});