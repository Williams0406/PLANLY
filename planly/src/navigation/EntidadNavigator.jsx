import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import EntidadDashboard from '../screens/entidad/EntidadDashboard';
import EntidadServicios from '../screens/entidad/EntidadServicios';
import EntidadCrearServicio from '../screens/entidad/EntidadCrearServicio';
import EntidadEditarServicio from '../screens/entidad/EntidadEditarServicio';
import EntidadPerfil from '../screens/entidad/EntidadPerfil';
import EntidadSetup from '../screens/entidad/EntidadSetup';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  primary: '#0F172A',
  accent: '#06B6D4',
  inactive: '#94A3B8',
  surface: '#FFFFFF',
  border: '#E2E8F0',
};

function ServiciosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServiciosList" component={EntidadServicios} />
      <Stack.Screen name="CrearServicio" component={EntidadCrearServicio} />
      <Stack.Screen name="EditarServicio" component={EntidadEditarServicio} />
    </Stack.Navigator>
  );
}

function TabIcon({ name, focused, color, size }) {
  return (
    <View style={tabStyles.wrap}>
      <Ionicons name={name} size={size} color={color} />
      {focused && (
        <View style={[tabStyles.dot, { backgroundColor: COLORS.accent }]} />
      )}
    </View>
  );
}

export default function EntidadNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Servicios: focused ? 'briefcase' : 'briefcase-outline',
            PerfilTab: focused ? 'business' : 'business-outline',
          };
          return (
            <TabIcon
              name={icons[route.name]}
              focused={focused}
              color={color}
              size={size}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={EntidadDashboard}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Servicios"
        component={ServiciosStack}
        options={{ title: 'Servicios' }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={EntidadPerfil}
        options={{ title: 'Mi Entidad' }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
});

export { EntidadSetup };