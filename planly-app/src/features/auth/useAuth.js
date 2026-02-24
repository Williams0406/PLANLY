// src/features/auth/useAuth.js

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "./authService";
import { setAccessToken } from "../../services/api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedTokens = await AsyncStorage.getItem("tokens");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedTokens && storedUser) {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        setAccessToken(parsedTokens.access);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("Error loading session", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);

      const data = await authService.login(username, password);

      setTokens(data);
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

  const register = async (data) => {
    return await authService.register(data);
  };

  const logout = async () => {
    setUser(null);
    setTokens(null);
    setAccessToken(null);

    await AsyncStorage.removeItem("tokens");
    await AsyncStorage.removeItem("user");
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
};