// src/screens/UpgradeScreen.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AppButton from "../components/AppButton";

export default function UpgradeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actualiza a Premium</Text>
      <Text>
        Desbloquea grupos ilimitados, reportes y exportaciones.
      </Text>
      <AppButton title="Suscribirme" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
});