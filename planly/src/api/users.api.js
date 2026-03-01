import client from './client';

export const usersApi = {
  getPerfil: () => client.get('/users/perfil/'),
  createPerfil: (data) => client.post('/users/perfil/', data),
  updatePerfil: (id, data) => client.patch(`/users/perfil/${id}/`, data),
};