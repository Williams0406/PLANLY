import apiClient from '@/lib/axios';
import Cookies from 'js-cookie';

export const authService = {
  async login(username, password) {
    const res = await apiClient.post('/auth/login/', { username, password });
    const { access, refresh } = res.data;

    // Guardar tokens en cookies
    Cookies.set('access_token', access, { expires: 1 / 24 }); // 1 hora
    Cookies.set('refresh_token', refresh, { expires: 7 });     // 7 días

    return res.data;
  },

  async register(data) {
    const res = await apiClient.post('/users/auth/register/', data);
    return res.data;
  },

  async logout() {
    try {
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        await apiClient.post('/auth/logout/', { refresh });
      }
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }
  },

  async getMe() {
    const res = await apiClient.get('/users/me/');
    return res.data;
  },

  isAuthenticated() {
    return !!Cookies.get('access_token');
  },
};