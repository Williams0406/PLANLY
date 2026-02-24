// src/features/auth/authService.js

import {
  loginRequest,
  registerRequest,
  refreshTokenRequest,
} from "../../services/authApi";

export const login = async (username, password) => {
  return await loginRequest(username, password);
};

export const register = async (data) => {
  return await registerRequest(data);
};

export const refreshToken = async (refresh) => {
  return await refreshTokenRequest(refresh);
};