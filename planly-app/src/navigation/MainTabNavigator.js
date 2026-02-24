// src/navigation/MainTabNavigator.js

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DiscoverScreen from "../screens/discover/DiscoverScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import PlanStackNavigator from "./PlanStackNavigator";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Planes" component={PlanStackNavigator} />
      <Tab.Screen name="Descubrir" component={DiscoverScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}