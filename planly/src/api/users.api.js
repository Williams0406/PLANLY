import client from './client';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const uploadFoto = async (url, method, data) => {
  const token = await SecureStore.getItemAsync('access_token');
  const response = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: data,
  });

  const raw = await response.text();
  let payload = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch (e) {
    payload = raw;
  }

  if (!response.ok) {
    throw {
      response: {
        status: response.status,
        data: payload,
      },
      message: typeof payload === 'string' ? payload : 'Upload failed',
    };
  }

  return { data: payload };
};

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
  cancelarSolicitudAmistad: (requestId) =>
    client.post(`/users/amistades/${requestId}/cancelar/`),

  getPerfil: () => client.get('/users/perfil/'),
  getFotos: () => client.get('/users/fotos/'),
  getUsuario: (id) => client.get(`/users/usuarios/${id}/`),
  createPerfil: (data) => client.post('/users/perfil/', data),
  updatePerfil: (id, data) => client.patch(`/users/perfil/${id}/`, data),
  createFoto: (data) => uploadFoto('/users/fotos/', 'POST', data),
  updateFoto: (id, data) => uploadFoto(`/users/fotos/${id}/`, 'PATCH', data),
  deleteFoto: (id) => client.delete(`/users/fotos/${id}/`),
};
