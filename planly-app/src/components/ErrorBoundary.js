// src/components/ErrorBoundary.js

import React from "react";
import { View, Text } from "react-native";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View>
          <Text>Algo salió mal.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}