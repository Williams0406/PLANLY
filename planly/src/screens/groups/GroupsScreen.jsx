import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useGroupsStore } from '../../store/groups.store';
import AnimatedCard from '../../components/ui/AnimatedCard';
import { GrupoSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Toast from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { colors, spacing, radius } from '../../theme';

export default function GroupsScreen({ navigation }) {
  const { grupos, isLoading, fetchGrupos } = useGroupsStore();
  const { toast, showToast, hideToast } = useToast();
  const [firstLoad, setFirstLoad] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchGrupos().finally(() => setFirstLoad(false));
    }, [])
  );

  const renderGrupo = ({ item, index }) => (
    <AnimatedCard
      onPress={() => navigation.navigate('GroupDetail', { grupo: item })}
      style={styles.cardWrapper}
    >
      <View style={styles.grupoHeader}>
        <View style={[styles.grupoAvatar, { backgroundColor: getAvatarColor(index) + '20' }]}>
          <Text style={[styles.grupoAvatarText, { color: getAvatarColor(index) }]}>
            {item.nombre?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.grupoInfo}>
          <Text style={styles.grupoNombre}>{item.nombre}</Text>
          <Text style={styles.grupoDesc} numberOfLines={1}>
            {item.descripcion || 'Sin descripción'}
          </Text>
          <Text style={styles.grupoFecha}>
            {new Date(item.created_at).toLocaleDateString('es-PE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.arrowWrap}>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
      </View>
    </AnimatedCard>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Grupos</Text>
          <Text style={styles.headerSubtitle}>
            {grupos.length} grupo{grupos.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <AnimatedCard
          onPress={() => navigation.navigate('CreateGroup')}
          style={styles.addBtnWrapper}
          haptic
        >
          <View style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
        </AnimatedCard>
      </View>

      {/* Skeleton durante primer carga */}
      {firstLoad && isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <GrupoSkeleton key={i} />)}
        </View>
      ) : grupos.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="Tu próxima experiencia comienza aquí"
          subtitle="Crea un grupo con tus amigos y empieza a planificar juntos"
          actionLabel="Crear nuevo grupo"
          onAction={() => navigation.navigate('CreateGroup')}
        />
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGrupo}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && !firstLoad}
              onRefresh={fetchGrupos}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const AVATAR_COLORS = [
  colors.primary, '#8B5CF6', '#F97316',
  '#EC4899', '#84CC16', '#14B8A6',
];

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addBtnWrapper: { borderRadius: radius.full },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { padding: spacing.lg, gap: spacing.sm },
  cardWrapper: { marginBottom: 2 },
  grupoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  grupoAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grupoAvatarText: { fontSize: 22, fontWeight: '800' },
  grupoInfo: { flex: 1 },
  grupoNombre: { fontSize: 15, fontWeight: '600', color: colors.text },
  grupoDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  grupoFecha: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});