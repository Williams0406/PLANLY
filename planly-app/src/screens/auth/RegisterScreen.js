// src/screens/auth/RegisterScreen.js

import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Picker,
} from "react-native";
import { useAuth } from "../../features/auth/useAuth";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("persona");

  const handleRegister = async () => {
    try {
      await register({
        username,
        email,
        password,
        tipo_usuario: tipoUsuario,
      });

      Alert.alert("Éxito", "Usuario creado correctamente");
      navigation.navigate("Login");
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
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <View style={styles.input}>
        <Button
          title={`Tipo: ${tipoUsuario}`}
          onPress={() =>
            setTipoUsuario(tipoUsuario === "persona" ? "entidad" : "persona")
          }
        />
      </View>

      <Button title="Registrarse" onPress={handleRegister} />
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