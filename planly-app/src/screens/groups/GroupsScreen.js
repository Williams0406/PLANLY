// src/screens/groups/GroupsScreen.js

import React from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
} from "react-native";
import { useGroups } from "../../features/groups/useGroups";

export default function GroupsScreen() {
  const { grupos, createGrupo } = useGroups();

  const handleCreate = async () => {
    await createGrupo({
      nombre: "Nuevo Grupo",
      descripcion: "Grupo creado desde app",
    });
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