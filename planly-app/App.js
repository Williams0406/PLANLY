// App.js

import React from "react";
import { AppProvider } from "./src/context/AppContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/features/auth/AuthContext";

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </AppProvider>
  );
}
