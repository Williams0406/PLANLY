// src/screens/groups/CreateGroupScreen.js

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import { useGroups } from "../../features/groups/useGroups";

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState("");
  const { createGroup } = useGroups();

  const handleCreate = async () => {
    await createGroup({ name });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AppInput
        placeholder="Nombre del grupo"
        value={name}
        onChangeText={setName}
      />
      <AppButton title="Crear grupo" onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});