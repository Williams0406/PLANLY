import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request: adjunta access token
client.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: si 401, intenta refresh automático
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = await SecureStore.getItemAsync('refresh_token');
        if (!refresh) throw new Error('No refresh token');

        const res = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;
        await SecureStore.setItemAsync('access_token', newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return client(originalRequest);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
