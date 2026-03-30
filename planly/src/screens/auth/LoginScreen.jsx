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
import { useAuthStore } from '../../store/auth.store';
import { colors, radius, spacing } from '../../theme';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const { login, isLoading, error, clearError } = useAuthStore();

  const validate = () => {
    const nextErrors = {};
    if (!username.trim()) nextErrors.username = 'El usuario es requerido';
    if (!password.trim()) nextErrors.password = 'La contraseña es requerida';
    if (password.length > 0 && password.length < 6) nextErrors.password = 'Mínimo 6 caracteres';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    try {
      await login(username.trim(), password);
    } catch (e) {
      Alert.alert('Error', error || 'Credenciales incorrectas');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#08111E', '#0F172A', '#153247']}
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
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark-outline" size={15} color="#67E8F9" />
              <Text style={styles.badgeText}>Acceso seguro</Text>
            </View>
          </View>

          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>
            Inicia sesión para retomar tus planes, revisar actividades y seguir coordinando sin perder el hilo.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="log-in-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Iniciar sesión</Text>
              <Text style={styles.cardSubtitle}>Accede con tu cuenta personal de Planly</Text>
            </View>
          </View>

          <Input
            label="Usuario"
            placeholder="Tu nombre de usuario"
            value={username}
            onChangeText={setUsername}
            leftIcon="person-circle-outline"
            error={errors.username}
            autoCapitalize="none"
          />

          <Input
            label="Contraseña"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button title="Entrar a Planly" onPress={handleLogin} loading={isLoading} style={styles.primaryAction} />

          <View style={styles.infoStrip}>
            <Ionicons name="sparkles-outline" size={16} color="#0891B2" />
            <Text style={styles.infoStripText}>Tu cuenta te lleva directo a tus grupos, planes y gastos compartidos.</Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Register')} activeOpacity={0.82}>
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryActionText}>Crear una cuenta nueva</Text>
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
    top: -80,
    right: -80,
  },
  glowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(34,197,94,0.08)',
    bottom: 80,
    left: -70,
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
    justifyContent: 'space-between',
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    color: '#CFFAFE',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 42,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.66)',
    maxWidth: '94%',
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
    lineHeight: 18,
  },
  primaryAction: {
    marginTop: 4,
    borderRadius: 16,
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: spacing.md,
    borderRadius: 14,
    backgroundColor: '#ECFEFF',
    padding: spacing.sm,
  },
  infoStripText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12.5,
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textSecondary,
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
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
