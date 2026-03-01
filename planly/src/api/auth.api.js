import client from './client';
import * as SecureStore from 'expo-secure-store';

export const authApi = {
  login: async (username, password) => {
    const response = await client.post('/token/', { username, password });
    const { access, refresh } = response.data;
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    return response.data;
  },

  register: async (data) => {
    const response = await client.post('/users/register/', data);
    return response.data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },

  getTokens: async () => {
    const access = await SecureStore.getItemAsync('access_token');
    const refresh = await SecureStore.getItemAsync('refresh_token');
    return { access, refresh };
  },
};