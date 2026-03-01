import client from './client';

export const entidadApi = {
  // Perfil de entidad
  getPerfil: () => client.get('/services/entidades/'),

  createPerfil: (data) => client.post('/services/entidades/', data),

  updatePerfil: (id, data) => client.patch(`/services/entidades/${id}/`, data),

  // Servicios de la entidad
  getMisServicios: () => client.get('/services/mis-servicios/'),

  createServicio: (data) => client.post('/services/mis-servicios/', data),

  updateServicio: (id, data) =>
    client.patch(`/services/mis-servicios/${id}/`, data),

  deleteServicio: (id) =>
    client.delete(`/services/mis-servicios/${id}/`),

  activarPromocion: (id) =>
    client.post(`/services/mis-servicios/${id}/activar_promocion/`),

  desactivarPromocion: (id) =>
    client.post(`/services/mis-servicios/${id}/desactivar_promocion/`),
};