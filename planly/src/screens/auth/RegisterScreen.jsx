import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi } from '../../api/auth.api';
import { colors, radius, spacing } from '../../theme';

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

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = 'El usuario es requerido';
    if (form.username.length > 0 && form.username.length < 3) nextErrors.username = 'Mínimo 3 caracteres';
    if (!form.email.trim()) nextErrors.email = 'El email es requerido';
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Email inválido';
    if (!form.password) nextErrors.password = 'La contraseña es requerida';
    if (form.password.length > 0 && form.password.length < 6) nextErrors.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        tipo_usuario: 'persona',
      });

      Alert.alert('Cuenta creada', 'Tu cuenta está lista. Inicia sesión y empieza a planear.', [
        { text: 'Ir al login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      const data = error.response?.data;
      const msg = data ? Object.values(data).flat().join('\n') : 'Error al registrar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#07111F', '#0F172A', '#12374B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../../assets/images/LogoIcon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Planly</Text>
          </View>

          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Te tomará solo un momento.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Empecemos</Text>
              <Text style={styles.cardSubtitle}>Completa tus datos</Text>
            </View>
          </View>

          <Input
            label="Usuario"
            placeholder="Elige un nombre de usuario"
            value={form.username}
            onChangeText={(value) => update('username', value)}
            leftIcon="person-circle-outline"
            error={errors.username}
            autoCapitalize="none"
          />

          <Input
            label="Email"
            placeholder="tu@email.com"
            value={form.email}
            onChangeText={(value) => update('email', value)}
            leftIcon="mail-outline"
            error={errors.email}
            keyboardType="email-address"
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChangeText={(value) => update('password', value)}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={form.confirmPassword}
            onChangeText={(value) => update('confirmPassword', value)}
            secureTextEntry
            leftIcon="shield-checkmark-outline"
            error={errors.confirmPassword}
          />

          <Button title="Crear cuenta" onPress={handleRegister} loading={loading} style={styles.primaryAction} />

          <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Login')} activeOpacity={0.82}>
            <Ionicons name="log-in-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryActionText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(6,182,212,0.14)',
    top: -90,
    left: -70,
  },
  glowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245,158,11,0.08)',
    bottom: 40,
    right: -60,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: 52,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.72)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 28,
    padding: spacing.lg,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  primaryAction: {
    borderRadius: 16,
    marginTop: 4,
  },
  secondaryAction: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CFFAFE',
    backgroundColor: '#F8FDFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.md,
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
