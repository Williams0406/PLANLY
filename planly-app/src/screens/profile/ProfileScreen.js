// src/screens/profile/ProfileScreen.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUser } from "../../features/user/useUser";

export default function ProfileScreen() {
  const { profile } = useUser();

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text>Nombre: {profile.name}</Text>
      <Text>Email: {profile.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});