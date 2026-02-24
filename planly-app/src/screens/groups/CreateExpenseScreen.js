// src/screens/groups/CreateExpenseScreen.js

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import { useFinance } from "../../features/finance/useFinance";

export default function CreateExpenseScreen({ navigation }) {
  const route = useRoute();
  const { group } = route.params;

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const { createMovimiento } = useFinance();

  const handleCreate = async () => {
    await createMovimiento({
      descripcion: description,
      monto: parseFloat(amount),
      group_id: group.id,
    });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AppInput
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
      />

      <AppInput
        placeholder="Monto"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <AppButton title="Agregar gasto" onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});