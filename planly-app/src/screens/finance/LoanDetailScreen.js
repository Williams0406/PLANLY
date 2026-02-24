// src/screens/finance/LoanDetailScreen.js

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import { useFinance } from "../../features/finance/useFinance";

export default function LoanDetailScreen() {
  const route = useRoute();
  const { loan } = route.params;

  const [amount, setAmount] = useState("");
  const { pagarPrestamo } = useFinance();

  const handlePayment = async () => {
    await pagarPrestamo(loan.id, parseFloat(amount));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del préstamo</Text>
      <Text>Monto total: {loan.total}</Text>
      <Text>Saldo pendiente: {loan.balance}</Text>

      <AppInput
        placeholder="Monto a pagar"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <AppButton title="Pagar" onPress={handlePayment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});