import client from './client';

export const groupsApi = {
  getGrupos: () => client.get('/groups/grupos/'),
  
  createGrupo: (data) => client.post('/groups/grupos/', data),
  
  getGrupo: (id) => client.get(`/groups/grupos/${id}/`),
  
  invitar: (grupoId, userId) =>
    client.post(`/groups/grupos/${grupoId}/invitar/`, { user_id: userId }),

  getPlanes: () => client.get('/groups/planes/'),
  
  createPlan: (data) => client.post('/groups/planes/', data),
  
  confirmarPlan: (planId) =>
    client.post(`/groups/planes/${planId}/confirmar/`),

  getParticipaciones: () => client.get('/groups/participaciones/'),
  
  responderParticipacion: (id, acepta) =>
    client.patch(`/groups/participaciones/${id}/`, {
      acepta_participar: acepta,
    }),
};