// src/screens/auth/WelcomeScreen.js

import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Planly</Text>

      <Button
        title="Iniciar Sesión"
        onPress={() => navigation.navigate("Login")}
      />

      <View style={{ marginTop: 10 }} />

      <Button
        title="Registrarse"
        onPress={() => navigation.navigate("Register")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    marginBottom: 30,
    textAlign: "center",
  },
});