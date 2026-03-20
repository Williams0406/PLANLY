import client from './client';

export const usersApi = {
  getMe: () => client.get('/users/me/'),
  getUsuarios: (params) => client.get('/users/usuarios/', { params }),

  getSolicitudesAmistad: () => client.get('/users/amistades/'),
  enviarSolicitudAmistad: (receiverId) =>
    client.post('/users/amistades/', { receiver_id: receiverId }),
  aceptarSolicitudAmistad: (requestId) =>
    client.post(`/users/amistades/${requestId}/aceptar/`),
  rechazarSolicitudAmistad: (requestId) =>
    client.post(`/users/amistades/${requestId}/rechazar/`),

  getPerfil: () => client.get('/users/perfil/'),
  createPerfil: (data) => client.post('/users/perfil/', data),
  updatePerfil: (id, data) => client.patch(`/users/perfil/${id}/`, data),
};