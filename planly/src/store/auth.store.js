import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import client from '../api/client';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.login(username, password);
      await get().fetchMe();
      set({ isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.detail || 'Usuario o contraseña incorrectos';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchMe: async () => {
    try {
      // Obtener username desde el token
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return null;

      // Decodificar JWT para obtener user_id
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Intentar obtener perfil persona
      try {
        const res = await client.get('/users/perfil/');
        if (res.data && res.data.length > 0) {
          const nextUser = { ...res.data[0], tipo_usuario: 'persona' };
          set({ user: nextUser });
          return nextUser;
        }
      } catch (e) {}

      // Si no tiene perfil persona, puede ser entidad
      // Guardamos info mínima del token
      const nextUser = {
        user: {
          id: payload.user_id,
          tipo_usuario: payload.tipo_usuario || 'persona',
        },
      };
      set(nextUser);
      return nextUser.user;
    } catch (e) {}
    return null;
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user) => set({ user }),

  checkAuth: async () => {
    try {
      const { access } = await authApi.getTokens();
      if (access) {
        set({ isAuthenticated: true });
        await get().fetchMe();
      }
    } catch (e) {
      set({ isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
