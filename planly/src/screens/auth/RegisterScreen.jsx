import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi } from '../../api/auth.api';
import { colors, spacing, radius } from '../../theme';

const TIPO_OPTIONS = [
  {
    value: 'persona',
    emoji: '👤',
    label: 'Persona',
    desc: 'Quiero organizar viajes y planes grupales',
    color: colors.primary,
  },
  {
    value: 'entidad',
    emoji: '🏢',
    label: 'Entidad',
    desc: 'Quiero ofrecer servicios turísticos',
    color: '#8B5CF6',
  },
];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    tipo_usuario: 'persona',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'El usuario es requerido';
    if (form.username.length > 0 && form.username.length < 3)
      e.username = 'Mínimo 3 caracteres';
    if (!form.email.trim()) e.email = 'El email es requerido';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido';
    if (!form.password) e.password = 'La contraseña es requerida';
    if (form.password.length > 0 && form.password.length < 6)
      e.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        tipo_usuario: form.tipo_usuario,
      });

      const successMsg =
        form.tipo_usuario === 'entidad'
          ? 'Cuenta de entidad creada. Inicia sesión para configurar tu perfil empresarial.'
          : 'Cuenta creada exitosamente. Inicia sesión para continuar.';

      Alert.alert('¡Cuenta creada! 🎉', successMsg, [
        { text: 'Ir al login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      const data = error.response?.data;
      const msg = data
        ? Object.values(data).flat().join('\n')
        : 'Error al registrar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={
          form.tipo_usuario === 'entidad'
            ? ['#1E1B4B', '#0F172A', '#0F172A']
            : ['#06B6D4', '#0F172A', '#0F172A']
        }
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.title}>Crea tu{'\n'}cuenta</Text>
          <Text style={styles.subtitle}>Únete y empieza a planificar</Text>
        </View>

        <View style={styles.card}>
          {/* Selector tipo mejorado */}
          <Text style={styles.selectorLabel}>¿Cómo usarás Planly?</Text>
          <View style={styles.selectorCol}>
            {TIPO_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.selectorCard,
                  form.tipo_usuario === opt.value && {
                    borderColor: opt.color,
                    backgroundColor: opt.color + '10',
                  },
                ]}
                onPress={() => update('tipo_usuario', opt.value)}
                activeOpacity={0.85}
              >
                <View style={styles.selectorLeft}>
                  <Text style={styles.selectorEmoji}>{opt.emoji}</Text>
                  <View>
                    <Text
                      style={[
                        styles.selectorTitle,
                        form.tipo_usuario === opt.value && {
                          color: opt.color,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.selectorDesc}>{opt.desc}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    form.tipo_usuario === opt.value && {
                      borderColor: opt.color,
                    },
                  ]}
                >
                  {form.tipo_usuario === opt.value && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: opt.color },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Usuario"
            placeholder="Elige un nombre de usuario"
            value={form.username}
            onChangeText={(v) => update('username', v)}
            leftIcon="person-outline"
            error={errors.username}
            autoCapitalize="none"
          />

          <Input
            label="Email"
            placeholder="tu@email.com"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            leftIcon="mail-outline"
            error={errors.email}
            keyboardType="email-address"
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={form.confirmPassword}
            onChangeText={(v) => update('confirmPassword', v)}
            secureTextEntry
            leftIcon="shield-checkmark-outline"
            error={errors.confirmPassword}
          />

          {form.tipo_usuario === 'entidad' && (
            <View style={styles.entidadNote}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#8B5CF6"
              />
              <Text style={styles.entidadNoteText}>
                Tu cuenta será revisada por nuestro equipo antes de publicar servicios.
              </Text>
            </View>
          )}

          <Button
            title="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
            style={[
              styles.btnRegister,
              form.tipo_usuario === 'entidad' && {
                backgroundColor: '#8B5CF6',
              },
            ]}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginHighlight}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: {
    position: 'absolute',
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(6,182,212,0.12)',
    top: -60, left: -60,
  },
  circle2: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(139,92,246,0.1)',
    bottom: 150, right: -50,
  },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: { paddingTop: 50, marginBottom: spacing.lg },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  titleContainer: { marginBottom: spacing.xl },
  emoji: { fontSize: 36, marginBottom: spacing.sm },
  title: {
    fontSize: 32, fontWeight: '800', color: '#FFFFFF',
    lineHeight: 40, marginBottom: spacing.xs,
  },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 24, padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  selectorLabel: {
    fontSize: 13, fontWeight: '600',
    color: colors.text, marginBottom: spacing.sm,
  },
  selectorCol: { gap: spacing.sm, marginBottom: spacing.md },
  selectorCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  selectorEmoji: { fontSize: 24 },
  selectorTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  selectorDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, maxWidth: 200 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  entidadNote: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: '#F5F3FF', borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  entidadNoteText: { fontSize: 12, color: '#6D28D9', flex: 1, lineHeight: 18 },
  btnRegister: { marginTop: spacing.xs },
  loginLink: { alignItems: 'center', marginTop: spacing.md },
  loginText: { fontSize: 14, color: colors.textSecondary },
  loginHighlight: { color: colors.primary, fontWeight: '600' },
});