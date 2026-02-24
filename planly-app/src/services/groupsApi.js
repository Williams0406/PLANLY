// src/services/groupsApi.js

import api from "./api";

export const getGrupos = async () => {
  const response = await api.get("/groups/grupos/");
  return response.data;
};

export const createGrupo = async (data) => {
  const response = await api.post("/groups/grupos/", data);
  return response.data;
};

export const invitarMiembro = async (grupoId, userId) => {
  const response = await api.post(`/groups/grupos/${grupoId}/invitar/`, {
    user_id: userId,
  });
  return response.data;
};

export const getPlanes = async () => {
  const response = await api.get("/groups/planes/");
  return response.data;
};

export const createPlan = async (data) => {
  const response = await api.post("/groups/planes/", data);
  return response.data;
};

export const confirmarPlan = async (planId) => {
  const response = await api.post(`/groups/planes/${planId}/confirmar/`);
  return response.data;
};

export const getParticipaciones = async () => {
  const response = await api.get("/groups/participaciones/");
  return response.data;
};

export const responderParticipacion = async (id, acepta) => {
  const response = await api.patch(
    `/groups/participaciones/${id}/`,
    { acepta_participar: acepta }
  );
  return response.data;
};