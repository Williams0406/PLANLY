import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../api/users.api';
import { groupsApi } from '../../api/groups.api';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const STATUS_UI = {
  amigos: { label: 'Amigo', color: colors.success },
  solicitud_enviada: { label: 'Solicitud enviada', color: colors.warning },
  solicitud_recibida: { label: 'Te envió solicitud', color: colors.primary },
  rechazada: { label: 'Solicitud rechazada', color: colors.error },
  ninguna: { label: 'Sin amistad', color: colors.textSecondary },
};

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyFriends, setOnlyFriends] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  const [groups, setGroups] = useState([]);
  const [inviteUser, setInviteUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const load = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        usersApi.getUsuarios(),
        groupsApi.getGrupos(),
      ]);
      setContacts(normalizeList(usersRes.data));
      setGroups(normalizeList(groupsRes.data));
    } catch (e) {
      setContacts([]);
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (onlyFriends && c.amistad_estado !== 'amigos') return false;
      if (!q) return true;
      return (
        c.nombre_mostrar?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.ciudad?.toLowerCase().includes(q)
      );
    });
  }, [contacts, search, onlyFriends]);

  const updateContact = (updated) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  };

  const sendRequest = async (contact) => {
    setActioningId(contact.id);
    try {
      const res = await usersApi.enviarSolicitudAmistad(contact.id);
      updateContact({
        id: contact.id,
        amistad_estado: 'solicitud_enviada',
        solicitud_amistad_id: res.data.id,
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo enviar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const acceptRequest = async (contact) => {
    if (!contact.solicitud_amistad_id) return;
    setActioningId(contact.id);
    try {
      await usersApi.aceptarSolicitudAmistad(contact.solicitud_amistad_id);
      updateContact({
        id: contact.id,
        amistad_estado: 'amigos',
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo aceptar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const rejectRequest = async (contact) => {
    if (!contact.solicitud_amistad_id) return;
    setActioningId(contact.id);
    try {
      await usersApi.rechazarSolicitudAmistad(contact.solicitud_amistad_id);
      updateContact({
        id: contact.id,
        amistad_estado: 'rechazada',
      });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo rechazar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const openInvite = (contact) => {
    setInviteUser(contact);
    setShowInviteModal(true);
  };

  const inviteToGroup = async (groupId) => {
    if (!inviteUser) return;
    try {
      await groupsApi.invitar(groupId, inviteUser.id);
      setShowInviteModal(false);
      Alert.alert('Listo', `Invitación enviada a @${inviteUser.username}`);
    } catch (e) {
      Alert.alert(
        'No se pudo invitar',
        e?.response?.data?.error || e?.response?.data?.detail || 'Verifica que seas admin del grupo y que el usuario no sea miembro aún.'
      );
    }
  };

  const renderActions = (contact) => {
    const status = contact.amistad_estado || 'ninguna';
    const loadingThis = actioningId === contact.id;

    if (status === 'solicitud_recibida') {
      return (
        <View style={styles.actionsRow}>
          <Button title="Aceptar" onPress={() => acceptRequest(contact)} loading={loadingThis} style={styles.smallBtn} />
          <Button title="Rechazar" variant="outline" onPress={() => rejectRequest(contact)} style={styles.smallBtn} />
          <Button title="Invitar a grupo" variant="ghost" onPress={() => openInvite(contact)} style={styles.smallBtn} />
        </View>
      );
    }

    return (
      <View style={styles.actionsRow}>
        {status === 'ninguna' || status === 'rechazada' ? (
          <Button title="Agregar" onPress={() => sendRequest(contact)} loading={loadingThis} style={styles.smallBtn} />
        ) : (
          <Button
            title={status === 'amigos' ? 'Amigo' : 'Pendiente'}
            variant="outline"
            disabled
            style={styles.smallBtn}
          />
        )}
        <Button title="Invitar a grupo" variant="ghost" onPress={() => openInvite(contact)} style={styles.smallBtn} />
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const initial = (item.nombre_mostrar || item.username || '?').charAt(0).toUpperCase();
    const isEntidad = item.tipo_usuario === 'entidad';
    const statusCfg = STATUS_UI[item.amistad_estado || 'ninguna'];

    return (
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: `${index % 2 === 0 ? colors.primary : colors.secondary}22` }]}>
              <Text style={[styles.avatarText, { color: index % 2 === 0 ? colors.primary : colors.secondary }]}>{initial}</Text>
            </View>
          </View>
          <View style={styles.infoWrap}>
            <Text style={styles.name}>{item.nombre_mostrar || item.username}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{isEntidad ? 'Entidad' : item.ocupacion || 'Persona'}</Text>
              {!!item.ciudad && <Text style={styles.meta}>· {item.ciudad}</Text>}
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${statusCfg.color}22` }]}>
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>
        </View>

        {renderActions(item)}
      </Card>
    );
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Contactos</Text>
        <Text style={styles.subtitle}>Busca por nombre y conecta con otros usuarios</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, usuario o ciudad"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity style={[styles.filterChip, !onlyFriends && styles.filterChipActive]} onPress={() => setOnlyFriends(false)}>
          <Text style={[styles.filterText, !onlyFriends && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, onlyFriends && styles.filterChipActive]} onPress={() => setOnlyFriends(true)}>
          <Text style={[styles.filterText, onlyFriends && styles.filterTextActive]}>Solo amigos</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <EmptyState emoji="👥" title="Sin contactos" subtitle="No hay usuarios para mostrar" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showInviteModal} transparent animationType="slide" onRequestClose={() => setShowInviteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invitar a grupo</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Usuario: {inviteUser ? `@${inviteUser.username}` : '-'}
            </Text>

            {groups.length === 0 ? (
              <EmptyState emoji="👥" title="Sin grupos" subtitle="Crea un grupo para poder invitar usuarios" />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {groups.map((g) => (
                  <TouchableOpacity key={g.id} style={styles.groupRow} onPress={() => inviteToGroup(g.id)}>
                    <View>
                      <Text style={styles.groupName}>{g.nombre}</Text>
                      <Text style={styles.groupDesc}>{g.descripcion || 'Sin descripción'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
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
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 13, color: colors.textSecondary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 46,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filtersRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.primary },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarWrap: { width: 50, alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', fontSize: 16 },
  infoWrap: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  username: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 12, color: colors.textSecondary },
  statusPill: { marginTop: 6, borderRadius: radius.full, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  smallBtn: { flex: 1, minHeight: 42 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { marginTop: 6, marginBottom: spacing.md, color: colors.textSecondary },
  groupRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: { fontSize: 14, fontWeight: '700', color: colors.text },
  groupDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, maxWidth: 240 },
});