import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useGroupsStore } from '../../store/groups.store';
import { useFinanceStore } from '../../store/finance.store';
import { usersApi } from '../../api/users.api';
import { CITY_OPTIONS_BY_COUNTRY, COUNTRY_OPTIONS, HOBBY_OPTIONS } from '../../data/profileOptions';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';

const LOGO = require('../../../assets/Logo.png');
const LEGACY_NATIONALITY_MAP = { Peruana: 'Perú', Argentina: 'Argentina', Boliviana: 'Bolivia', Brasileña: 'Brasil', Chilena: 'Chile', Colombiana: 'Colombia', Ecuatoriana: 'Ecuador', Mexicana: 'México', Uruguaya: 'Uruguay', Venezolana: 'Venezuela' };
const normalizeList = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
const splitHobbies = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const normalizeCountryValue = (value) => LEGACY_NATIONALITY_MAP[value] || value || 'Perú';

const buildUploadData = (asset, options = {}) => {
  const formData = new FormData();
  const originalName = asset.fileName || asset.uri?.split('/').pop() || '';
  const mimeType = asset.mimeType || (String(originalName).toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const sanitizedBaseName = String(originalName).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const fileName = `${sanitizedBaseName || `perfil-${Date.now()}`}.${extension}`;
  formData.append('imagen', { uri: asset.uri, name: fileName, type: mimeType });
  formData.append('es_principal', options.esPrincipal ? 'true' : 'false');
  formData.append('visible', 'true');
  formData.append('orden', String(options.orden || 0));
  return formData;
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data?.detail === 'string') return data.detail;
  return Object.values(data).flat().join('\n') || fallback;
};

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const grupos = useGroupsStore((state) => state.grupos);
  const fetchGrupos = useGroupsStore((state) => state.fetchGrupos);
  const balance = useFinanceStore((state) => state.balance);
  const fetchBalance = useFinanceStore((state) => state.fetchBalance);
  const [photos, setPhotos] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState(null);
  const [picker, setPicker] = useState({ visible: false, type: 'country', query: '' });
  const [hobbySearch, setHobbySearch] = useState('');
  const [customHobby, setCustomHobby] = useState('');
  const [editForm, setEditForm] = useState({ ocupacion: '', descripcion: '', nacionalidad: 'Perú', ciudad: '', hobbies: [] });

  const hydrateEditForm = useCallback((profile) => {
    setEditForm({
      ocupacion: profile?.ocupacion || '',
      descripcion: profile?.descripcion || '',
      nacionalidad: normalizeCountryValue(profile?.nacionalidad),
      ciudad: profile?.ciudad || '',
      hobbies: splitHobbies(profile?.hobbies),
    });
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const perfil = await fetchMe();
        const [, , photosRes, usersRes] = await Promise.all([
          fetchGrupos(),
          fetchBalance(),
          usersApi.getFotos().catch(() => ({ data: [] })),
          usersApi.getUsuarios().catch(() => ({ data: [] })),
        ]);
        if (!active) return;
        setPhotos(normalizeList(photosRes.data).filter((item) => item.visible !== false));
        setFriends(normalizeList(usersRes.data).filter((item) => item.amistad_estado === 'amigos'));
        hydrateEditForm(perfil);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [fetchBalance, fetchGrupos, fetchMe, hydrateEditForm]));

  const principalPhoto = useMemo(() => photos.find((item) => item.es_principal) || photos[0] || null, [photos]);
  const fullName = user?.nombres ? `${user.nombres} ${user.apellidos || ''}`.trim() : user?.username || 'Mi perfil';
  const initials = fullName.split(' ').filter(Boolean).slice(0, 2).map((item) => item[0]?.toUpperCase()).join('');
  const displayedHobbies = splitHobbies(user?.hobbies);
  const cityOptions = CITY_OPTIONS_BY_COUNTRY[editForm.nacionalidad] || [];
  const filteredCountries = COUNTRY_OPTIONS.filter((item) => item.toLowerCase().includes(picker.query.trim().toLowerCase()));
  const filteredCities = cityOptions.filter((item) => item.toLowerCase().includes(picker.query.trim().toLowerCase()));
  const filteredHobbyOptions = HOBBY_OPTIONS.filter((item) => item.toLowerCase().includes(hobbySearch.trim().toLowerCase()));

  const statItems = [
    { label: 'Grupos', value: String(grupos.length || 0), icon: 'people-outline', tone: '#DBEAFE', color: '#1D4ED8' },
    { label: 'Amigos', value: String(friends.length || 0), icon: 'heart-outline', tone: '#FCE7F3', color: '#BE185D' },
    { label: 'Balance', value: balance ? `S/ ${Number(balance.balance).toFixed(0)}` : '--', icon: 'wallet-outline', tone: '#DCFCE7', color: Number(balance?.balance || 0) >= 0 ? '#166534' : colors.error },
  ];

  const requestPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para actualizar tu perfil.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    return result.canceled || !result.assets?.length ? null : result.assets[0];
  };

  const refreshProfileData = async () => {
    await Promise.all([fetchMe(), usersApi.getFotos().then((res) => setPhotos(normalizeList(res.data)))]);
  };

  const uploadPhoto = async (mode) => {
    const asset = await requestPhoto();
    if (!asset) return;
    const setter = mode === 'main' ? setUploadingMain : setUploadingGallery;
    setter(true);
    try {
      const formData = buildUploadData(asset, { esPrincipal: mode === 'main', orden: photos.length + 1 });
      await usersApi.createFoto(formData);
      await refreshProfileData();
      Alert.alert(mode === 'main' ? 'Foto de perfil actualizada' : 'Foto agregada', mode === 'main' ? 'Tu nueva foto principal ya está visible.' : 'La foto se agregó a tu galería.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No se pudo subir la foto.'));
    } finally {
      setter(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await usersApi.updatePerfil(user.id, {
        ocupacion: editForm.ocupacion.trim(),
        descripcion: editForm.descripcion.trim(),
        nacionalidad: editForm.nacionalidad,
        ciudad: editForm.ciudad.trim(),
        hobbies: editForm.hobbies.join(', '),
      });
      await fetchMe();
      setEditing(false);
      Alert.alert('Perfil actualizado', 'Tus cambios ya se reflejan en tu perfil.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No se pudo actualizar el perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = (photo) => {
    Alert.alert('Eliminar imagen', photo.es_principal ? 'Se eliminará tu foto de perfil actual.' : 'Se eliminará esta imagen de tu galería.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setRemovingPhotoId(photo.id);
          try {
            await usersApi.deleteFoto(photo.id);
            await refreshProfileData();
          } catch (error) {
            Alert.alert('Error', getErrorMessage(error, 'No se pudo eliminar la imagen.'));
          } finally {
            setRemovingPhotoId(null);
          }
        },
      },
    ]);
  };

  const toggleHobby = (hobby) => setEditForm((prev) => ({ ...prev, hobbies: prev.hobbies.includes(hobby) ? prev.hobbies.filter((item) => item !== hobby) : [...prev.hobbies, hobby] }));
  const removeHobby = (hobby) => setEditForm((prev) => ({ ...prev, hobbies: prev.hobbies.filter((item) => item !== hobby) }));
  const addCustomHobby = () => {
    const cleaned = customHobby.trim();
    if (!cleaned) return;
    setEditForm((prev) => ({ ...prev, hobbies: prev.hobbies.some((item) => item.toLowerCase() === cleaned.toLowerCase()) ? prev.hobbies : [...prev.hobbies, cleaned] }));
    setCustomHobby('');
    setHobbySearch('');
  };
  const openPicker = (type) => setPicker({ visible: true, type, query: type === 'country' ? editForm.nacionalidad || '' : editForm.ciudad || '' });
  const closePicker = () => setPicker((prev) => ({ ...prev, visible: false, query: '' }));
  const selectCountry = (country) => {
    setEditForm((prev) => ({ ...prev, nacionalidad: country, ciudad: (CITY_OPTIONS_BY_COUNTRY[country] || []).includes(prev.ciudad) ? prev.ciudad : '' }));
    closePicker();
  };
  const selectCity = (city) => {
    setEditForm((prev) => ({ ...prev, ciudad: city }));
    closePicker();
  };

  const handleLogout = () => Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: logout }]);

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0F172A', '#082F49', '#155E75']} style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}><Image source={LOGO} style={styles.logo} resizeMode="contain" /><Text style={styles.brandText}>Planly</Text></View>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}><Ionicons name="create-outline" size={18} color="#fff" /><Text style={styles.editBtnText}>Editar perfil</Text></TouchableOpacity>
          </View>
          <View style={styles.avatarWrap}>
            {principalPhoto?.imagen ? <Image source={{ uri: principalPhoto.imagen }} style={styles.avatarImage} /> : <View style={styles.avatarFallback}><Text style={styles.avatarLetters}>{initials || 'P'}</Text></View>}
            <TouchableOpacity style={styles.cameraBadge} onPress={() => uploadPhoto('main')} disabled={uploadingMain}><Ionicons name={uploadingMain ? 'hourglass-outline' : 'camera-outline'} size={16} color="#fff" /></TouchableOpacity>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.role}>{user?.ocupacion || 'Cuéntale al mundo a qué te dedicas'}</Text>
          <Text style={styles.description}>{user?.descripcion || 'Tu perfil puede contar quién eres, qué te mueve y qué tipo de planes disfrutas más.'}</Text>
          <View style={styles.heroMetaRow}>
            <HeroMeta icon="earth-outline" label={normalizeCountryValue(user?.nacionalidad) || 'País pendiente'} />
            <HeroMeta icon="location-outline" label={user?.ciudad || 'Ciudad pendiente'} />
          </View>
        </LinearGradient>
        <View style={styles.statsRow}>{statItems.map((item) => <Card key={item.label} style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: item.tone }]}><Ionicons name={item.icon} size={18} color={item.color} /></View><Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text><Text style={styles.statLabel}>{item.label}</Text></Card>)}</View>
        <Card style={styles.sectionCard}>
          <SectionHeader icon="images-outline" title="Fotos" actionLabel="Agregar" onPress={() => uploadPhoto('gallery')} loading={uploadingGallery} />
          {photos.length === 0 ? <Text style={styles.emptyText}>Todavía no agregaste fotos a tu perfil.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>{photos.map((photo) => <View key={photo.id} style={styles.photoTile}><Image source={{ uri: photo.imagen }} style={styles.photoImage} />{photo.es_principal ? <View style={styles.primaryBadge}><Ionicons name="star" size={12} color="#fff" /><Text style={styles.primaryBadgeText}>Perfil</Text></View> : null}<TouchableOpacity style={styles.deletePhotoBtn} onPress={() => removePhoto(photo)} disabled={removingPhotoId === photo.id}><Ionicons name={removingPhotoId === photo.id ? 'hourglass-outline' : 'trash-outline'} size={14} color="#fff" /></TouchableOpacity></View>)}</ScrollView>}
        </Card>
        <Card style={styles.sectionCard}>
          <SectionHeader icon="person-circle-outline" title="Sobre mí" actionLabel="Editar" onPress={() => setEditing(true)} />
          <Text style={styles.bioText}>{user?.descripcion || 'Aún no escribiste tu presentación. Usa esta sección para mostrar tu estilo, energía y lo que disfrutas hacer.'}</Text>
          <View style={styles.detailGrid}>
            <DetailItem icon="briefcase-outline" label="Ocupación" value={user?.ocupacion || 'Aún no agregada'} />
            <DetailItem icon="sparkles-outline" label="Nacionalidad" value={normalizeCountryValue(user?.nacionalidad) || 'Aún no agregada'} />
            <DetailItem icon="location-outline" label="Ciudad" value={user?.ciudad || 'Aún no agregada'} />
          </View>
        </Card>
        <Card style={styles.sectionCard}>
          <SectionHeader icon="flash-outline" title="Hobbies" actionLabel="Editar" onPress={() => setEditing(true)} />
          {displayedHobbies.length === 0 ? <Text style={styles.emptyText}>Aún no seleccionaste hobbies para tu perfil.</Text> : <View style={styles.hobbiesWrap}>{displayedHobbies.map((hobby) => <View key={hobby} style={styles.hobbyPill}><Text style={styles.hobbyText}>{hobby}</Text></View>)}</View>}
        </Card>
        <Card style={styles.sectionCard}>
          <SectionTitle icon="people-outline" title="Amigos" />
          {friends.length === 0 ? <Text style={styles.emptyText}>Todavía no tienes amigos agregados en Planly.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsRow}>{friends.map((friend) => <View key={friend.id} style={styles.friendCard}><View style={styles.friendAvatar}><Text style={styles.friendAvatarText}>{String(friend.nombre_mostrar || friend.username || 'P').charAt(0).toUpperCase()}</Text></View><Text style={styles.friendName} numberOfLines={1}>{friend.nombre_mostrar || friend.username}</Text><Text style={styles.friendMeta} numberOfLines={1}>{friend.ocupacion || friend.ciudad || 'Amigo Planly'}</Text></View>)}</ScrollView>}
        </Card>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Ionicons name="log-out-outline" size={20} color={colors.error} /><Text style={styles.logoutText}>Cerrar sesión</Text></TouchableOpacity>
      </ScrollView>

      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.modalIconBtn}><Ionicons name="close" size={22} color={colors.text} /></TouchableOpacity>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={handleSaveProfile} style={styles.modalSaveBtn} disabled={saving}><Text style={styles.modalSaveText}>{saving ? 'Guardando...' : 'Guardar'}</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Card style={styles.editorCard}>
              <Text style={styles.editorTitle}>Sobre ti</Text>
              <Text style={styles.editorHint}>Redacta libremente tu ocupación y una presentación que realmente suene a ti.</Text>
              <FieldLabel label="Ocupación" />
              <TextInput value={editForm.ocupacion} onChangeText={(value) => setEditForm((prev) => ({ ...prev, ocupacion: value }))} placeholder="Ej. Chef de autor, diseñadora UX, fotógrafo de bodas, viajero full time" style={styles.input} />
              <FieldLabel label="Sobre mí" />
              <TextInput value={editForm.descripcion} onChangeText={(value) => setEditForm((prev) => ({ ...prev, descripcion: value }))} placeholder="Cuenta cómo eres, qué disfrutas, qué tipo de planes te inspiran o cómo te gustaría conectar con otros." style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
            </Card>

            <Card style={styles.editorCard}>
              <Text style={styles.editorTitle}>Ubicación</Text>
              <Text style={styles.editorHint}>Primero eliges tu país y después te mostramos ciudades de ese país con buscador.</Text>
              <FieldLabel label="Nacionalidad / País" />
              <SelectionField label={editForm.nacionalidad || 'Selecciona un país'} placeholder="Selecciona un país" onPress={() => openPicker('country')} />
              <FieldLabel label="Ciudad" />
              <SelectionField label={editForm.ciudad || 'Selecciona o escribe una ciudad'} placeholder="Selecciona o escribe una ciudad" onPress={() => openPicker('city')} disabled={!editForm.nacionalidad} />
            </Card>

            <Card style={styles.editorCard}>
              <Text style={styles.editorTitle}>Hobbies</Text>
              <Text style={styles.editorHint}>Mezcla hobbies sugeridos con otros escritos por ti para que tu perfil se vea más real y personal.</Text>
              {editForm.hobbies.length > 0 ? <View style={styles.selectedWrap}>{editForm.hobbies.map((item) => <TouchableOpacity key={item} style={styles.selectedPill} onPress={() => removeHobby(item)}><Text style={styles.selectedPillText}>{item}</Text><Ionicons name="close" size={14} color="#92400E" /></TouchableOpacity>)}</View> : <Text style={styles.emptyText}>Aún no elegiste hobbies.</Text>}
              <FieldLabel label="Buscar hobbies sugeridos" />
              <TextInput value={hobbySearch} onChangeText={setHobbySearch} placeholder="Busca entre opciones como música, viajes, cine, surf..." style={styles.input} />
              <View style={styles.optionWrap}>{filteredHobbyOptions.map((item) => { const active = editForm.hobbies.includes(item); return <TouchableOpacity key={item} style={[styles.optionChip, active && styles.optionChipActive]} onPress={() => toggleHobby(item)}><Text style={[styles.optionText, active && styles.optionTextActive]}>{item}</Text></TouchableOpacity>; })}</View>
              <FieldLabel label="Agregar hobby personalizado" />
              <View style={styles.inlineInputRow}>
                <TextInput value={customHobby} onChangeText={setCustomHobby} placeholder="Ej. Astrofotografía, café de especialidad, kayak" style={[styles.input, styles.inlineInput]} />
                <TouchableOpacity style={styles.addInlineBtn} onPress={addCustomHobby}><Ionicons name="add" size={18} color="#fff" /></TouchableOpacity>
              </View>
            </Card>

            <Button title="Guardar cambios" onPress={handleSaveProfile} loading={saving} style={styles.modalButton} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={picker.visible} transparent animationType="slide" onRequestClose={closePicker}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{picker.type === 'country' ? 'Elegir país' : 'Elegir ciudad'}</Text>
                <Text style={styles.sheetHint}>{picker.type === 'country' ? 'Busca y selecciona el país con el que te identificas.' : `Busca una ciudad de ${editForm.nacionalidad || 'tu país seleccionado'} o escríbela manualmente.`}</Text>
              </View>
              <TouchableOpacity style={styles.modalIconBtn} onPress={closePicker}><Ionicons name="close" size={20} color={colors.text} /></TouchableOpacity>
            </View>
            <View style={styles.searchField}>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              <TextInput value={picker.query} onChangeText={(value) => setPicker((prev) => ({ ...prev, query: value }))} placeholder={picker.type === 'country' ? 'Buscar país' : 'Buscar ciudad'} placeholderTextColor={colors.textSecondary} style={styles.searchInput} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetList}>
              {picker.type === 'country' ? filteredCountries.map((item) => <TouchableOpacity key={item} style={styles.sheetOption} onPress={() => selectCountry(item)}><Text style={styles.sheetOptionText}>{item}</Text>{editForm.nacionalidad === item ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}</TouchableOpacity>) : <>
                {filteredCities.map((item) => <TouchableOpacity key={item} style={styles.sheetOption} onPress={() => selectCity(item)}><Text style={styles.sheetOptionText}>{item}</Text>{editForm.ciudad === item ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}</TouchableOpacity>)}
                <View style={styles.manualCityBox}>
                  <Text style={styles.manualCityTitle}>Escribir ciudad manualmente</Text>
                  <Text style={styles.manualCityHint}>Si no ves tu ciudad en la lista sugerida, puedes usar el texto que escribiste arriba.</Text>
                  <Button title={picker.query.trim() ? `Usar "${picker.query.trim()}"` : 'Escribe una ciudad arriba'} onPress={() => selectCity(picker.query.trim())} disabled={!picker.query.trim()} />
                </View>
              </>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionTitle({ icon, title }) {
  return <View style={styles.sectionTitleRow}><View style={styles.sectionIconWrap}><Ionicons name={icon} size={16} color={colors.primary} /></View><Text style={styles.sectionTitleText}>{title}</Text></View>;
}
function SectionHeader({ icon, title, actionLabel, onPress, loading }) {
  return <View style={styles.sectionHeader}><SectionTitle icon={icon} title={title} />{actionLabel ? <TouchableOpacity style={styles.sectionAction} onPress={onPress} disabled={loading}><Ionicons name={loading ? 'hourglass-outline' : 'create-outline'} size={18} color={colors.primary} /><Text style={styles.sectionActionText}>{loading ? 'Procesando' : actionLabel}</Text></TouchableOpacity> : null}</View>;
}
function HeroMeta({ icon, label }) {
  return <View style={styles.heroMetaPill}><Ionicons name={icon} size={14} color="#CFFAFE" /><Text style={styles.heroMetaText}>{label}</Text></View>;
}
function FieldLabel({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}
function SelectionField({ label, placeholder, onPress, disabled }) {
  return <TouchableOpacity style={[styles.selectionField, disabled && styles.selectionFieldDisabled]} onPress={onPress} disabled={disabled}><Text style={[styles.selectionText, !label && styles.selectionPlaceholder]}>{label || placeholder}</Text><Ionicons name="chevron-down" size={18} color={colors.textSecondary} /></TouchableOpacity>;
}
function DetailItem({ icon, label, value }) {
  return <View style={styles.detailChip}><View style={styles.detailIconWrap}><Ionicons name={icon} size={16} color={colors.primary} /></View><View style={styles.detailCopy}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF0F4' },
  content: { paddingBottom: spacing.xxl },
  hero: { paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  brandBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.full, paddingVertical: 10, paddingHorizontal: 14 },
  logo: { width: 28, height: 28 },
  brandText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 10 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  avatarWrap: { width: 116, height: 116, borderRadius: 58, padding: 4, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: spacing.md },
  avatarImage: { width: '100%', height: '100%', borderRadius: 56 },
  avatarFallback: { flex: 1, borderRadius: 56, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center' },
  avatarLetters: { color: '#fff', fontSize: 36, fontWeight: '800' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 6, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  role: { color: '#A5F3FC', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  description: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.md },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  heroMetaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(6,182,212,0.22)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8 },
  heroMetaText: { color: '#ECFEFF', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: -24 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', marginTop: 4 },
  sectionCard: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFEFF', alignItems: 'center', justifyContent: 'center' },
  sectionTitleText: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionActionText: { color: colors.primary, fontWeight: '700' },
  emptyText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  photosRow: { gap: spacing.sm, paddingRight: spacing.xs },
  photoTile: { width: 148, height: 184, borderRadius: 22, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  primaryBadge: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  primaryBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  deletePhotoBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(15,23,42,0.78)', alignItems: 'center', justifyContent: 'center' },
  bioText: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  detailGrid: { gap: spacing.sm, marginTop: spacing.md },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5EDF5' },
  detailIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ECFEFF', alignItems: 'center', justifyContent: 'center' },
  detailCopy: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '600', marginTop: 2 },
  hobbiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hobbyPill: { backgroundColor: '#FEF3C7', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 9 },
  hobbyText: { color: '#92400E', fontSize: 13, fontWeight: '700' },
  friendsRow: { gap: spacing.sm, paddingRight: spacing.xs },
  friendCard: { width: 132, backgroundColor: '#F8FAFC', borderRadius: 22, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#E5EDF5' },
  friendAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#CFFAFE', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  friendAvatarText: { color: '#155E75', fontSize: 22, fontWeight: '800' },
  friendName: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
  friendMeta: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  logoutBtn: { marginHorizontal: spacing.lg, marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#FEF2F2', borderRadius: radius.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.error },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSaveBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full },
  modalSaveText: { color: '#fff', fontWeight: '700' },
  modalContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  editorCard: { gap: spacing.sm },
  editorTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  editorHint: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, color: colors.text },
  textarea: { minHeight: 110 },
  selectionField: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectionFieldDisabled: { opacity: 0.45 },
  selectionText: { color: colors.text, fontSize: 14, flex: 1, paddingRight: spacing.sm },
  selectionPlaceholder: { color: colors.textSecondary },
  selectedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  selectedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 9 },
  selectedPillText: { color: '#92400E', fontWeight: '700' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surface },
  optionChipActive: { backgroundColor: '#ECFEFF', borderColor: colors.primary },
  optionText: { color: colors.textSecondary, fontWeight: '600' },
  optionTextActive: { color: colors.primary },
  inlineInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  inlineInput: { flex: 1 },
  addInlineBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  modalButton: { marginTop: spacing.sm },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.35)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.lg, maxHeight: '84%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sheetHint: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, maxWidth: 260 },
  searchField: { marginTop: spacing.md, backgroundColor: '#F8FAFC', borderRadius: radius.md, borderWidth: 1, borderColor: '#E5EDF5', paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, paddingVertical: 14, marginLeft: spacing.sm, color: colors.text },
  sheetList: { paddingTop: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  sheetOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5EDF5', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14 },
  sheetOptionText: { color: colors.text, fontWeight: '600' },
  manualCityBox: { marginTop: spacing.sm, borderWidth: 1, borderColor: '#E5EDF5', backgroundColor: '#F8FAFC', borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  manualCityTitle: { color: colors.text, fontWeight: '700' },
  manualCityHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
