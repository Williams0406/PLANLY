import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "./authService";
import { setAccessToken } from "../../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStoredSession = useCallback(async () => {
    try {
      const storedTokens = await AsyncStorage.getItem("tokens");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedTokens && storedUser) {
        const parsedTokens = JSON.parse(storedTokens);
        setAccessToken(parsedTokens.access);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("Error loading session", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredSession();
  }, [loadStoredSession]);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const data = await authService.login(username, password);

      setAccessToken(data.access);
      const userData = { username };
      setUser(userData);

      await AsyncStorage.setItem("tokens", JSON.stringify(data));
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      throw error.response?.data || error.message;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => authService.register(data);

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    await AsyncStorage.removeItem("tokens");
    await AsyncStorage.removeItem("user");
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
