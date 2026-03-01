import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEntidadStore } from '../../store/entidad.store';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { colors, spacing, radius } from '../../theme';

const PURPLE = '#8B5CF6';
const PURPLE_DARK = '#1E1B4B';

export default function EntidadSetup({ pendingApproval = false }) {
  const { createPerfil, fetchPerfil } = useEntidadStore();
  const { logout } = useAuthStore();

  const [form, setForm] = useState({
    nombre_comercial: '',
    ruc: '',
    direccion: '',
    contacto_referencia: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nombre_comercial.trim())
      e.nombre_comercial = 'El nombre comercial es requerido';
    if (!form.direccion.trim())
      e.direccion = 'La dirección es requerida';
    if (!form.contacto_referencia.trim())
      e.contacto_referencia = 'El contacto es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createPerfil(form);
      await fetchPerfil();
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'Error al registrar entidad';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de espera de aprobación
  if (pendingApproval) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[PURPLE_DARK, '#0F172A']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.pendingContent}>
          <View style={styles.pendingIcon}>
            <Text style={styles.pendingEmoji}>⏳</Text>
          </View>
          <Text style={styles.pendingTitle}>En revisión</Text>
          <Text style={styles.pendingSubtitle}>
            Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando tu cuenta sea aprobada para publicar servicios.
          </Text>
          <View style={styles.pendingSteps}>
            {[
              { icon: 'checkmark-circle', label: 'Solicitud enviada', done: true },
              { icon: 'time-outline', label: 'Revisión del equipo Planly', done: false },
              { icon: 'rocket-outline', label: 'Publicar servicios', done: false },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Ionicons
                  name={step.icon}
                  size={20}
                  color={step.done ? colors.success : 'rgba(255,255,255,0.3)'}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    !step.done && styles.stepLabelDim,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
          <Button
            title="Cerrar sesión"
            onPress={logout}
            variant="outline"
            style={styles.pendingLogout}
          />
        </View>
      </View>
    );
  }

  // Formulario de setup
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[PURPLE_DARK, '#0F172A', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.6)" />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🏢</Text>
          </View>
          <Text style={styles.title}>Configura tu{'\n'}empresa</Text>
          <Text style={styles.subtitle}>
            Completa tu perfil empresarial para empezar a ofrecer servicios en Planly
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.headerBadge, { backgroundColor: PURPLE + '15' }]}>
              <Ionicons name="business-outline" size={16} color={PURPLE} />
              <Text style={[styles.headerBadgeText, { color: PURPLE }]}>
                Perfil Empresarial
              </Text>
            </View>
          </View>

          <Input
            label="Nombre comercial"
            placeholder="Nombre de tu empresa o negocio"
            value={form.nombre_comercial}
            onChangeText={(v) => update('nombre_comercial', v)}
            leftIcon="storefront-outline"
            error={errors.nombre_comercial}
            autoCapitalize="words"
          />

          <Input
            label="RUC (opcional)"
            placeholder="20XXXXXXXXX"
            value={form.ruc}
            onChangeText={(v) => update('ruc', v)}
            leftIcon="card-outline"
            keyboardType="numeric"
          />

          <Input
            label="Dirección"
            placeholder="Dirección de tu negocio"
            value={form.direccion}
            onChangeText={(v) => update('direccion', v)}
            leftIcon="location-outline"
            error={errors.direccion}
            autoCapitalize="words"
          />

          <Input
            label="Contacto de referencia"
            placeholder="Nombre del responsable"
            value={form.contacto_referencia}
            onChangeText={(v) => update('contacto_referencia', v)}
            leftIcon="person-outline"
            error={errors.contacto_referencia}
            autoCapitalize="words"
          />

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={16} color={PURPLE} />
            <Text style={styles.infoText}>
              Tu información será verificada antes de activar tu cuenta. El proceso toma 24-48 horas.
            </Text>
          </View>

          <Button
            title="Enviar solicitud"
            onPress={handleSubmit}
            loading={loading}
            style={{ backgroundColor: PURPLE }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(139,92,246,0.12)', top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(139,92,246,0.08)', bottom: 100, left: -60,
  },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  topBar: {
    paddingTop: 54, marginBottom: spacing.lg,
    flexDirection: 'row', justifyContent: 'flex-end',
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoutText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  titleContainer: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  logoIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.4)',
  },
  logoEmoji: { fontSize: 32 },
  title: {
    fontSize: 30, fontWeight: '800', color: '#fff',
    textAlign: 'center', lineHeight: 38,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 20, maxWidth: '85%',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 24, padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  cardHeader: { marginBottom: spacing.md },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: '#F5F3FF', borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: { fontSize: 12, color: '#6D28D9', flex: 1, lineHeight: 18 },
  // Pending
  pendingContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xl, gap: spacing.lg,
  },
  pendingIcon: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.4)',
  },
  pendingEmoji: { fontSize: 46 },
  pendingTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  pendingSubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 22,
  },
  pendingSteps: {
    width: '100%', gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.lg, padding: spacing.lg,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepLabel: { fontSize: 14, fontWeight: '500', color: '#fff' },
  stepLabelDim: { color: 'rgba(255,255,255,0.35)' },
  pendingLogout: { borderColor: 'rgba(255,255,255,0.3)', width: '100%' },
});