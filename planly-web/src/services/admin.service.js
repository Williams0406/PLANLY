import apiClient from '@/lib/axios';

export const adminService = {
  async getDashboard() {
    const res = await apiClient.get('/services/admin/dashboard/');
    return res.data;
  },

  async getCategorias(params = { scope: 'all' }) {
    const res = await apiClient.get('/services/categorias/', { params });
    return res.data;
  },

  async createCategoria(data) {
    const res = await apiClient.post('/services/categorias/', data);
    return res.data;
  },

  async updateCategoria(id, data) {
    const res = await apiClient.patch(`/services/categorias/${id}/`, data);
    return res.data;
  },

  async deleteCategoria(id) {
    await apiClient.delete(`/services/categorias/${id}/`);
  },

  async getEntidades(params = {}) {
    const res = await apiClient.get('/services/admin/entidades/', { params });
    return res.data;
  },

  async aprobarEntidad(id) {
    const res = await apiClient.post(`/services/admin/entidades/${id}/aprobar/`);
    return res.data;
  },

  async revocarEntidad(id) {
    const res = await apiClient.post(`/services/admin/entidades/${id}/revocar/`);
    return res.data;
  },
};
