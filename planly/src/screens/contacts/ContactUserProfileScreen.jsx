import React, { useCallback, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { usersApi } from '../../api/users.api';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import { colors, radius, spacing } from '../../theme';

const splitHobbies = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function ContactUserProfileScreen({ route, navigation }) {
  const userId = route.params?.userId;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (pull = false) => {
    try {
      pull ? setRefreshing(true) : setLoading(true);
      const res = await usersApi.getUsuario(userId);
      setUser(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [userId])
  );

  const principalPhoto = useMemo(
    () => user?.fotos?.find((item) => item.es_principal) || user?.fotos?.[0] || null,
    [user]
  );

  const summary = useMemo(() => {
    const hobbies = splitHobbies(user?.hobbies);
    return [
      { label: 'Fotos', value: user?.fotos?.length || 0, icon: 'images-outline' },
      { label: 'Hobbies', value: hobbies.length, icon: 'sparkles-outline' },
      { label: 'Perfil público', value: user ? 1 : 0, icon: 'eye-outline' },
    ];
  }, [user]);

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      >
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Ionicons name="person-circle-outline" size={16} color="#67E8F9" />
            <Text style={styles.heroBadgeText}>Perfil público</Text>
          </View>

          <View style={styles.avatarWrap}>
            {principalPhoto?.imagen ? (
              <Image source={{ uri: principalPhoto.imagen }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{String(user?.nombre_mostrar || user?.username || 'P').charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{user?.nombre_mostrar || user?.username}</Text>
          <Text style={styles.meta}>{user?.ocupacion || 'Usuario Planly'}</Text>
          <Text style={styles.meta}>{[user?.ciudad, user?.nacionalidad].filter(Boolean).join(' · ') || 'Sin ubicación pública'}</Text>

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

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Sobre este usuario</Text>
          <Text style={styles.body}>{user?.descripcion || 'Aún no agregó una descripción pública.'}</Text>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Fotos</Text>
            <Text style={styles.sectionCount}>{user?.fotos?.length || 0}</Text>
          </View>

          {!user?.fotos?.length ? (
            <EmptyState emoji="🖼️" title="Sin fotos" subtitle="Este usuario todavía no tiene fotos visibles." />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
              {user.fotos.map((photo) => (
                <View key={photo.id} style={styles.photoTile}>
                  <Image source={{ uri: photo.imagen }} style={styles.photoImage} />
                  {photo.es_principal ? (
                    <View style={styles.primaryBadge}>
                      <Ionicons name="star" size={11} color="#FFFFFF" />
                      <Text style={styles.primaryBadgeText}>Perfil</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Intereses</Text>
          {splitHobbies(user?.hobbies).length === 0 ? (
            <Text style={styles.body}>No hay hobbies públicos para mostrar.</Text>
          ) : (
            <View style={styles.hobbiesWrap}>
              {splitHobbies(user?.hobbies).map((hobby, index) => (
                <View key={`${hobby}-${index}`} style={styles.hobbyPill}>
                  <Ionicons name="sparkles-outline" size={12} color="#92400E" />
                  <Text style={styles.hobbyText}>{hobby}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  content: { paddingBottom: spacing.xl + 24, gap: spacing.lg },
  hero: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroBadge: {
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
  avatarWrap: { width: 116, height: 116, borderRadius: 58, backgroundColor: 'rgba(255,255,255,0.18)', padding: 4, marginTop: spacing.lg },
  avatarImage: { width: '100%', height: '100%', borderRadius: 54 },
  avatarFallback: { flex: 1, borderRadius: 54, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: spacing.md, textAlign: 'center' },
  meta: { color: 'rgba(255,255,255,0.72)', marginTop: 4, textAlign: 'center', lineHeight: 20 },
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
  sectionBlock: {
    marginHorizontal: spacing.lg,
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
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  sectionCount: { fontSize: 13, fontWeight: '700', color: colors.primary },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  photosRow: { gap: spacing.sm },
  photoTile: { width: 160, height: 200, borderRadius: 22, overflow: 'hidden', backgroundColor: '#EEF6FB' },
  photoImage: { width: '100%', height: '100%' },
  primaryBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  primaryBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hobbiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hobbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hobbyText: { color: '#92400E', fontSize: 12, fontWeight: '700' },
});
