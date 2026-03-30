import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { groupsApi } from '../../api/groups.api';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import { colors, radius, spacing } from '../../theme';

export default function ContactGroupDetailScreen({ route, navigation }) {
  const groupId = route.params?.groupId;
  const initialGroup = route.params?.group;
  const [group, setGroup] = useState(initialGroup || null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (pull = false) => {
    try {
      pull ? setRefreshing(true) : setLoading(true);
      const res = await groupsApi.getMiembros(groupId);
      setGroup({ id: res.data.id, nombre: res.data.nombre, descripcion: res.data.descripcion, lider_id: res.data.lider_id });
      setMembers(res.data.miembros || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [groupId])
  );

  const summary = useMemo(() => {
    const leaders = members.filter((member) => member.es_lider).length;
    return [
      { label: 'Integrantes', value: members.length, icon: 'people-outline' },
      { label: 'Líderes', value: leaders, icon: 'ribbon-outline' },
      { label: 'Visibles', value: members.length > 0 ? 1 : 0, icon: 'eye-outline' },
    ];
  }, [members]);

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      >
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Ionicons name="people-circle-outline" size={16} color="#67E8F9" />
            <Text style={styles.heroBadgeText}>Detalle del grupo</Text>
          </View>

          <Text style={styles.title}>{group?.nombre || 'Grupo'}</Text>
          <Text style={styles.subtitle}>{group?.descripcion || 'Integrantes del grupo'}</Text>

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

        {members.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState emoji="👥" title="Sin integrantes" subtitle="Este grupo todavía no tiene integrantes visibles." />
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((member, index) => {
              const initial = (member.nombre_mostrar || member.username || '?').charAt(0).toUpperCase();
              return (
                <TouchableOpacity
                  key={member.id}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('ContactUserProfile', { userId: member.user_id })}
                >
                  <View style={styles.memberCard}>
                    <View style={styles.memberTop}>
                      <View style={[styles.avatar, { backgroundColor: `${index % 2 === 0 ? colors.primary : colors.secondary}22` }]}>
                        <Text style={[styles.avatarText, { color: index % 2 === 0 ? colors.primary : colors.secondary }]}>{initial}</Text>
                      </View>

                      <View style={styles.copy}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.name}>{member.nombre_mostrar || member.username}</Text>
                          {member.es_lider ? (
                            <RolePill label="Líder" tone="#DCFCE7" color="#166534" icon="ribbon-outline" />
                          ) : (
                            <RolePill label={member.rol} tone="#E0F2FE" color="#075985" icon="person-outline" />
                          )}
                        </View>
                        <Text style={styles.username}>@{member.username}</Text>

                        <View style={styles.metaRow}>
                          {!!member.ocupacion && (
                            <View style={styles.metaBadge}>
                              <Ionicons name="briefcase-outline" size={12} color="#075985" />
                              <Text style={styles.metaBadgeText}>{member.ocupacion}</Text>
                            </View>
                          )}
                          {!!member.ciudad && (
                            <View style={styles.metaBadge}>
                              <Ionicons name="location-outline" size={12} color="#075985" />
                              <Text style={styles.metaBadgeText}>{member.ciudad}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RolePill({ label, tone, color, icon }) {
  return (
    <View style={[styles.rolePill, { backgroundColor: tone }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.roleText, { color }]}>{label}</Text>
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
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  title: { marginTop: spacing.md, color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 6, color: 'rgba(255,255,255,0.74)', lineHeight: 21 },
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
  summaryLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11.5, fontWeight: '600' },
  emptyWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  membersList: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  memberCard: {
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
    marginBottom: spacing.md,
  },
  memberTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  copy: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  username: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  metaRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaBadgeText: { fontSize: 11.5, fontWeight: '700', color: '#075985' },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: { fontSize: 11.5, fontWeight: '700', textTransform: 'capitalize' },
});
