import { create } from 'zustand';
import { authService } from '@/services/auth.service';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    if (!authService.isAuthenticated()) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  login: async (username, password) => {
    await authService.login(username, password);
    const user = await authService.getMe();
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));