import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import PlansScreen from '../screens/plans/PlansScreen';
import ContactsScreen from '../screens/contacts/ContactsScreen';
import CatalogScreen from '../screens/services/CatalogScreen';
import FinanceScreen from '../screens/finance/FinanceScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color, size, badge }) {
  return (
    <View style={tabStyles.iconWrap}>
      <Ionicons name={name} size={size} color={color} />
      {badge ? (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {focused && <View style={[tabStyles.dot, { backgroundColor: color }]} />}
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Plan: focused ? 'calendar' : 'calendar-outline',
            Contacts: focused ? 'people' : 'people-outline',
            Services: focused ? 'compass' : 'compass-outline',
            Finance: focused ? 'wallet' : 'wallet-outline',
            Profile: focused ? 'person' : 'person-outline',
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
      <Tab.Screen name="Plan" component={PlansScreen} options={{ title: 'Plan' }} />
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Contactos' }} />
      <Tab.Screen name="Services" component={CatalogScreen} options={{ title: 'Servicios' }} />
      <Tab.Screen name="Finance" component={FinanceScreen} options={{ title: 'Finanzas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});