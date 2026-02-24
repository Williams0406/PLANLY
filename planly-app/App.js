// App.js

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AppProvider } from "./src/context/AppContext";
import TabNavigator from "./src/navigation/TabNavigator";

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}