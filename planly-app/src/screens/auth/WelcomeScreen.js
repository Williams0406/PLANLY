// src/screens/auth/WelcomeScreen.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>PLANLY</Text>
        <Text style={styles.title}>Organiza tus gastos en grupo, sin fricción</Text>
        <Text style={styles.subtitle}>
          Empieza en segundos y mantén claridad total en cada pago compartido.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Register")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>Crear Cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F6F8FB",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
  },
  eyebrow: {
    color: "#0E7490",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    color: "#0F172A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#0E7490",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
});
