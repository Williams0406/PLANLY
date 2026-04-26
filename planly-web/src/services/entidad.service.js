import apiClient from '@/lib/axios';

export const entidadService = {
  async getPerfil() {
    const res = await apiClient.get('/services/entidades/');
    const items = res.data.results || res.data;
    return items.length > 0 ? items[0] : null;
  },

  async createPerfil(data) {
    const res = await apiClient.post('/services/entidades/', data);
    return res.data;
  },

  async updatePerfil(id, data) {
    const res = await apiClient.patch(`/services/entidades/${id}/`, data);
    return res.data;
  },
};
