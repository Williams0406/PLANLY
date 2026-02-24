// src/components/Toast.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <View style={styles.toast}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
  },
  text: { color: "#fff" },
});