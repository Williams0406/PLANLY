import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { useEntidadStore } from '../store/entidad.store';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import EntidadNavigator from './EntidadNavigator';
import { EntidadSetup } from './EntidadNavigator';
import { colors } from '../theme';

export default function RootNavigator() {
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const { perfil, fetchPerfil } = useEntidadStore();
  const [checking, setChecking] = useState(true);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  useEffect(() => {
    checkAuth().finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.tipo_usuario === 'entidad') {
      setLoadingPerfil(true);
      fetchPerfil().finally(() => setLoadingPerfil(false));
    }
  }, [isAuthenticated, user]);

  if (checking || loadingPerfil) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderNavigator = () => {
    if (!isAuthenticated) return <AuthNavigator />;

    if (user?.tipo_usuario === 'entidad') {
      // Si no tiene perfil de entidad → setup
      if (!perfil) return <EntidadSetup />;
      // Si tiene perfil pero no está aprobado → pantalla de espera
      if (!perfil.aprobado) return <EntidadSetup pendingApproval />;
      return <EntidadNavigator />;
    }

    return <AppNavigator />;
  };

  return (
    <NavigationContainer>
      {renderNavigator()}
    </NavigationContainer>
  );
}