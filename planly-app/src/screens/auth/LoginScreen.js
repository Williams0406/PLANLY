// src/screens/auth/LoginScreen.js

import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../features/auth/useAuth";

export default function LoginScreen() {
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(username, password);
    } catch (error) {
      Alert.alert("Error", JSON.stringify(error));
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Usuario"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button
        title={loading ? "Cargando..." : "Ingresar"}
        onPress={handleLogin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },
});