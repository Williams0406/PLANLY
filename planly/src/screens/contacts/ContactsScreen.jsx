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
import { LinearGradient } from 'expo-linear-gradient';
import { usersApi } from '../../api/users.api';
import { groupsApi } from '../../api/groups.api';
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
  amigos: { label: 'Amigo', color: colors.success, icon: 'checkmark-circle' },
  solicitud_enviada: { label: 'Solicitud pendiente', color: colors.warning, icon: 'time-outline' },
  solicitud_recibida: { label: 'Te envió solicitud', color: colors.primary, icon: 'mail-open-outline' },
  rechazada: { label: 'Solicitud rechazada', color: colors.error, icon: 'close-circle-outline' },
  ninguna: { label: 'Disponible', color: colors.textSecondary, icon: 'person-add-outline' },
};

export default function ContactsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyFriends, setOnlyFriends] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [inviteUser, setInviteUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const load = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([usersApi.getUsuarios(), groupsApi.getGrupos()]);
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

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (onlyFriends && contact.amistad_estado !== 'amigos') return false;
      if (!q) return true;
      return (
        contact.nombre_mostrar?.toLowerCase().includes(q) ||
        contact.username?.toLowerCase().includes(q) ||
        contact.ciudad?.toLowerCase().includes(q)
      );
    });
  }, [contacts, search, onlyFriends]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((group) => {
      if (!q) return true;
      return group.nombre?.toLowerCase().includes(q) || group.descripcion?.toLowerCase().includes(q);
    });
  }, [groups, search]);

  const summary = useMemo(() => {
    const friends = contacts.filter((item) => item.amistad_estado === 'amigos').length;
    const pending = contacts.filter((item) => item.amistad_estado === 'solicitud_enviada' || item.amistad_estado === 'solicitud_recibida').length;

    return activeTab === 'usuarios'
      ? [
          { label: 'Contactos visibles', value: filteredContacts.length, icon: 'people-outline' },
          { label: 'Amigos', value: friends, icon: 'heart-outline' },
          { label: 'Pendientes', value: pending, icon: 'time-outline' },
        ]
      : [
          { label: 'Mis grupos', value: filteredGroups.length, icon: 'people-circle-outline' },
          { label: 'Explorables', value: groups.length, icon: 'grid-outline' },
          { label: 'Búsqueda activa', value: search ? 1 : 0, icon: 'search-outline' },
        ];
  }, [activeTab, contacts, filteredContacts.length, filteredGroups.length, groups.length, search]);

  const updateContact = (updated) => {
    setContacts((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
  };

  const sendRequest = async (contact) => {
    setActioningId(contact.id);
    try {
      const res = await usersApi.enviarSolicitudAmistad(contact.id);
      updateContact({ id: contact.id, amistad_estado: 'solicitud_enviada', solicitud_amistad_id: res.data.id });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo enviar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const cancelRequest = async (contact) => {
    if (!contact.solicitud_amistad_id) return;
    setActioningId(contact.id);
    try {
      await usersApi.cancelarSolicitudAmistad(contact.solicitud_amistad_id);
      updateContact({ id: contact.id, amistad_estado: 'ninguna', solicitud_amistad_id: null });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'No se pudo cancelar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const acceptRequest = async (contact) => {
    if (!contact.solicitud_amistad_id) return;
    setActioningId(contact.id);
    try {
      await usersApi.aceptarSolicitudAmistad(contact.solicitud_amistad_id);
      updateContact({ id: contact.id, amistad_estado: 'amigos' });
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
      updateContact({ id: contact.id, amistad_estado: 'rechazada' });
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
      Alert.alert('No se pudo invitar', e?.response?.data?.error || e?.response?.data?.detail || 'Verifica permisos o membresía.');
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
          <Button title="Invitar" variant="ghost" onPress={() => openInvite(contact)} style={styles.smallBtn} />
        </View>
      );
    }

    if (status === 'solicitud_enviada') {
      return (
        <View style={styles.actionsRow}>
          <Button title="Cancelar" variant="outline" onPress={() => cancelRequest(contact)} loading={loadingThis} style={styles.smallBtn} />
          <Button title="Invitar" variant="ghost" onPress={() => openInvite(contact)} style={styles.smallBtn} />
        </View>
      );
    }

    return (
      <View style={styles.actionsRow}>
        {status === 'ninguna' || status === 'rechazada' ? (
          <Button title="Agregar" onPress={() => sendRequest(contact)} loading={loadingThis} style={styles.smallBtn} />
        ) : (
          <Button title="Amigo" variant="outline" disabled style={styles.smallBtn} />
        )}
        <Button title="Invitar" variant="ghost" onPress={() => openInvite(contact)} style={styles.smallBtn} />
      </View>
    );
  };

  const renderContactItem = ({ item, index }) => {
    const initial = (item.nombre_mostrar || item.username || '?').charAt(0).toUpperCase();
    const isEntidad = item.tipo_usuario === 'entidad';
    const statusCfg = STATUS_UI[item.amistad_estado || 'ninguna'];

    return (
      <TouchableOpacity activeOpacity={0.95} onPress={() => navigation.navigate('ContactUserProfile', { userId: item.id })}>
        <View style={styles.contactCard}>
          <View style={styles.cardTop}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, { backgroundColor: `${index % 2 === 0 ? colors.primary : colors.secondary}22` }]}>
                <Text style={[styles.avatarText, { color: index % 2 === 0 ? colors.primary : colors.secondary }]}>{initial}</Text>
              </View>
            </View>

            <View style={styles.infoWrap}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.nombre_mostrar || item.username}</Text>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>

                <View style={[styles.statusPill, { backgroundColor: `${statusCfg.color}18` }]}>
                  <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
                  <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Ionicons name={isEntidad ? 'business-outline' : 'person-outline'} size={12} color="#075985" />
                  <Text style={styles.metaBadgeText}>{isEntidad ? 'Entidad' : item.ocupacion || 'Persona'}</Text>
                </View>
                {!!item.ciudad && (
                  <View style={styles.metaBadge}>
                    <Ionicons name="location-outline" size={12} color="#075985" />
                    <Text style={styles.metaBadgeText}>{item.ciudad}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {renderActions(item)}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({ item, index }) => (
    <TouchableOpacity activeOpacity={0.95} onPress={() => navigation.navigate('ContactGroupDetail', { groupId: item.id, group: item })}>
      <View style={styles.groupCard}>
        <View style={styles.groupIcon}>
          <Ionicons name={index % 2 === 0 ? 'people-outline' : 'layers-outline'} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{item.nombre}</Text>
          <Text style={styles.groupDesc}>{item.descripcion || 'Sin descripción del grupo.'}</Text>
        </View>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <Loader />;

  const data = activeTab === 'usuarios' ? filteredContacts : filteredGroups;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={activeTab === 'usuarios' ? renderContactItem : renderGroupItem}
        ListHeaderComponent={
          <>
            <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
              <View style={styles.heroBadge}>
                <Ionicons name="people-outline" size={16} color="#67E8F9" />
                <Text style={styles.heroBadgeText}>Red de contactos</Text>
              </View>

              <Text style={styles.title}>Conecta, revisa grupos y avanza más rápido</Text>
              <Text style={styles.subtitle}>
                {activeTab === 'usuarios'
                  ? 'Gestiona solicitudes, amigos e invitaciones desde una sola vista.'
                  : 'Explora los grupos donde ya participas y entra a ver sus integrantes.'}
              </Text>

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

            <View style={styles.controlsWrap}>
              <View style={styles.segmentedWrap}>
                <TouchableOpacity style={[styles.segmentedChip, activeTab === 'usuarios' && styles.segmentedChipActive]} onPress={() => setActiveTab('usuarios')}>
                  <Ionicons name="person-circle-outline" size={16} color={activeTab === 'usuarios' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.segmentedText, activeTab === 'usuarios' && styles.segmentedTextActive]}>Usuarios</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentedChip, activeTab === 'grupos' && styles.segmentedChipActive]} onPress={() => setActiveTab('grupos')}>
                  <Ionicons name="people-circle-outline" size={16} color={activeTab === 'grupos' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.segmentedText, activeTab === 'grupos' && styles.segmentedTextActive]}>Mis grupos</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={activeTab === 'usuarios' ? 'Buscar por nombre, usuario o ciudad' : 'Buscar grupo por nombre'}
                  placeholderTextColor={colors.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {activeTab === 'usuarios' ? (
                <View style={styles.filtersRow}>
                  <TouchableOpacity style={[styles.filterChip, !onlyFriends && styles.filterChipActive]} onPress={() => setOnlyFriends(false)}>
                    <Text style={[styles.filterText, !onlyFriends && styles.filterTextActive]}>Todos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.filterChip, onlyFriends && styles.filterChipActive]} onPress={() => setOnlyFriends(true)}>
                    <Text style={[styles.filterText, onlyFriends && styles.filterTextActive]}>Solo amigos</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              emoji={activeTab === 'usuarios' ? '👥' : '🗂️'}
              title={activeTab === 'usuarios' ? 'Sin contactos' : 'Sin grupos'}
              subtitle={activeTab === 'usuarios' ? 'No hay usuarios para mostrar.' : 'No perteneces a grupos visibles por ahora.'}
            />
          </View>
        }
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

      <Modal visible={showInviteModal} transparent animationType="slide" onRequestClose={() => setShowInviteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Invitar a grupo</Text>
                <Text style={styles.modalSubtitle}>Usuario: {inviteUser ? `@${inviteUser.username}` : '-'}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInviteModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {groups.length === 0 ? (
              <EmptyState emoji="👥" title="Sin grupos" subtitle="Crea un grupo para poder invitar usuarios." />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {groups.map((group, index) => (
                  <TouchableOpacity key={group.id} style={styles.groupRow} onPress={() => inviteToGroup(group.id)}>
                    <View style={styles.groupRowIcon}>
                      <Ionicons name={index % 2 === 0 ? 'paper-plane-outline' : 'people-outline'} size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupName}>{group.nombre}</Text>
                      <Text style={styles.groupDesc}>{group.descripcion || 'Sin descripción'}</Text>
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
  container: { flex: 1, backgroundColor: '#F4F8FB' },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
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
  title: { marginTop: spacing.md, fontSize: 30, fontWeight: '800', color: '#FFFFFF', lineHeight: 38 },
  subtitle: { marginTop: 8, color: 'rgba(255,255,255,0.74)', lineHeight: 22, maxWidth: '94%' },
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
  controlsWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  segmentedWrap: { flexDirection: 'row', gap: spacing.sm },
  segmentedChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#D9E6F2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  segmentedChipActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  segmentedText: { color: colors.textSecondary, fontWeight: '700' },
  segmentedTextActive: { color: colors.primary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: '#DCE7F0',
    minHeight: 48,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filtersRow: { flexDirection: 'row', gap: spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderColor: '#DCE7F0',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  filterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.primary },
  list: { paddingBottom: spacing.xl + 24, gap: spacing.sm },
  emptyWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  contactCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  avatarWrap: { width: 56, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', fontSize: 18 },
  infoWrap: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  username: { marginTop: 2, fontSize: 12.5, color: colors.textSecondary },
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  smallBtn: { flex: 1, minHeight: 42 },
  groupCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontSize: 15, fontWeight: '800', color: colors.text },
  groupDesc: { fontSize: 12.5, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalSubtitle: { marginTop: 4, color: colors.textSecondary },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRow: {
    borderWidth: 1,
    borderColor: '#E4EDF5',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FCFEFF',
  },
  groupRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
