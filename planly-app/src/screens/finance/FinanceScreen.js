// src/screens/finance/FinanceScreen.js

import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
} from "react-native";
import { useFinance } from "../../features/finance/useFinance";

export default function FinanceScreen() {
  const { movimientos, balance } = useFinance();

  return (
    <View style={styles.container}>
      {balance && (
        <View style={styles.balanceCard}>
          <Text>Ingresos: {balance.ingresos}</Text>
          <Text>Gastos: {balance.gastos}</Text>
          <Text style={styles.total}>
            Balance: {balance.balance}
          </Text>
        </View>
      )}

      <FlatList
        data={movimientos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.descripcion}</Text>
            <Text>{item.monto}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  balanceCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  total: { fontWeight: "bold", marginTop: 5 },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
});