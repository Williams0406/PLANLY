import client from './client';

export const groupsApi = {
  getGrupos: () => client.get('/groups/grupos/'),
  createGrupo: (data) => client.post('/groups/grupos/', data),
  getGrupo: (id) => client.get(`/groups/grupos/${id}/`),
  invitar: (grupoId, userId) =>
    client.post(`/groups/grupos/${grupoId}/invitar/`, { user_id: userId }),

  getPlanes: () => client.get('/groups/planes/'),
  createPlan: (data) => client.post('/groups/planes/', data),
  updatePlan: (id, data) => client.patch(`/groups/planes/${id}/`, data),
  confirmarPlan: (planId) => client.post(`/groups/planes/${planId}/confirmar/`),
  getOrganigrama: (planId) => client.get(`/groups/planes/${planId}/organigrama/`),

  getActividades: () => client.get('/groups/actividades/'),
  createActividad: (data) => client.post('/groups/actividades/', data),

  getAsignacionesServicio: () => client.get('/groups/asignaciones-servicio/'),
  createAsignacionServicio: (data) =>
    client.post('/groups/asignaciones-servicio/', data),
  confirmarPagoServicio: (id, movimientoId) =>
    client.post(`/groups/asignaciones-servicio/${id}/confirmar_pago/`, {
      movimiento_id: movimientoId,
    }),

  getSolicitudesCambio: () => client.get('/groups/solicitudes-cambio/'),
  aprobarSolicitudCambio: (id) => client.post(`/groups/solicitudes-cambio/${id}/aprobar/`),

  getParticipaciones: () => client.get('/groups/participaciones/'),
  responderParticipacion: (id, acepta) =>
    client.patch(`/groups/participaciones/${id}/`, {
      acepta_participar: acepta,
    }),
};