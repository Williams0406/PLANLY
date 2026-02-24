// src/screens/groups/GroupsScreen.js

import React from "react";
import { View, Text, FlatList, Button, StyleSheet, Alert } from "react-native";
import { useGroups } from "../../features/groups/useGroups";

export default function GroupsScreen() {
  const { grupos, createGrupo, loadGrupos } = useGroups();

  const handleCreate = async () => {
    try {
      await createGrupo({
        nombre: "Nuevo Grupo",
        descripcion: "Grupo creado desde app",
      });
      await loadGrupos();
      Alert.alert("Listo", "Grupo creado correctamente");
    } catch (error) {
      Alert.alert(
        "No se pudo crear el grupo",
        error?.response?.data
          ? JSON.stringify(error.response.data)
          : "Revisa tu sesión o la conexión con la API."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Crear Grupo" onPress={handleCreate} />

      <FlatList
        data={grupos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.nombre}</Text>
            <Text>{item.descripcion}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 10,
  },
  title: { fontWeight: "bold" },
});
