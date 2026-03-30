import apiClient from '@/lib/axios';

export const serviciosService = {
  async getPublicos(params = {}) {
    const res = await apiClient.get('/services/web/servicios/', { params });
    return res.data;
  },

  async getPublicoById(id) {
    const res = await apiClient.get(`/services/web/servicios/${id}/`);
    return res.data;
  },

  async getEntidadPublica(id) {
    const res = await apiClient.get(`/services/catalogo/entidades/${id}/`);
    return res.data;
  },

  async getMisServicios() {
    const res = await apiClient.get('/services/mis-servicios/');
    return res.data;
  },

  async create(data) {
    const res = await apiClient.post('/services/mis-servicios/', data);
    return res.data;
  },

  async update(id, data) {
    const res = await apiClient.patch(`/services/mis-servicios/${id}/`, data);
    return res.data;
  },

  async delete(id) {
    await apiClient.delete(`/services/mis-servicios/${id}/`);
  },

  async activarPromocion(id) {
    const res = await apiClient.post(
      `/services/mis-servicios/${id}/activar_promocion/`
    );
    return res.data;
  },

  async desactivarPromocion(id) {
    const res = await apiClient.post(
      `/services/mis-servicios/${id}/desactivar_promocion/`
    );
    return res.data;
  },
};
