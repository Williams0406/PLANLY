import client from './client';

export const servicesApi = {
  getCatalogo: (params) => client.get('/services/catalogo/', { params }),
  getServicio: (id) => client.get(`/services/catalogo/${id}/`),
};