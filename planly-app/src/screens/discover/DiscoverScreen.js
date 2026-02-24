// src/screens/discover/DiscoverScreen.js

import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useServices } from "../../features/services/useServices";

export default function DiscoverScreen() {
  const { services, loading } = useServices();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 15 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.nombre}</Text>
          <Text>{item.descripcion}</Text>
          <Text style={styles.price}>
            S/ {item.precio_actual}
          </Text>
          <Text style={styles.entity}>
            {item.entidad_nombre}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  price: {
    marginTop: 8,
    fontWeight: "bold",
  },
  entity: {
    marginTop: 5,
    fontStyle: "italic",
  },
});