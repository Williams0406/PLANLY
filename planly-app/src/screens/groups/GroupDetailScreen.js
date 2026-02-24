// src/screens/groups/GroupDetailScreen.js

import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import AppButton from "../../components/AppButton";

export default function GroupDetailScreen({ navigation }) {
  const route = useRoute();
  const { group } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>

      <Text style={styles.subtitle}>Miembros</Text>
      <FlatList
        data={group.members || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.name}</Text>
        )}
      />

      <AppButton
        title="Agregar gasto"
        onPress={() =>
          navigation.navigate("CreateExpense", { group })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subtitle: { marginTop: 15, fontWeight: "bold" },
  item: { marginVertical: 4 },
});