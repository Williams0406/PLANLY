// src/services/api.js

import axios from "axios";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export const setAccessToken = (token) => {
  global.accessToken = token;
};

api.interceptors.request.use((config) => {
  const token = global.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("Token expirado - intentar refresh");
      // Aquí luego conectaremos refresh automático
    }
    return Promise.reject(error);
  }
);

export default api;