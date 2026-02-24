// src/screens/OnboardingScreen.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AppButton from "../components/AppButton";

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Planly</Text>
      <Text>
        Organiza gastos en grupo de forma simple y clara.
      </Text>
      <AppButton
        title="Comenzar"
        onPress={() => navigation.replace("Groups")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
});