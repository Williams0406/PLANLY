import client from './client';

export const servicesApi = {
  getCatalogo: (params) => client.get('/services/catalogo/', { params }),
  getServicio: (id) => client.get(`/services/catalogo/${id}/`),
  getEntidad: (id) => client.get(`/services/catalogo/entidades/${id}/`),
  crearResenaServicio: (data) => client.post('/services/resenas-servicio/', data),
  crearResenaEntidad: (data) => client.post('/services/resenas-entidad/', data),
};
