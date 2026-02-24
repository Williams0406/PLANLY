import React from "react";
import { TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function AppInput(props) {
  return <TextInput style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});