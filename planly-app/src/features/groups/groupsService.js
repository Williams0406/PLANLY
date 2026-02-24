// src/features/groups/groupsService.js

import * as groupsApi from "../../services/groupsApi";

export const fetchGrupos = () => groupsApi.getGrupos();
export const createGrupo = (data) => groupsApi.createGrupo(data);
export const invitarMiembro = (grupoId, userId) =>
  groupsApi.invitarMiembro(grupoId, userId);

export const fetchPlanes = () => groupsApi.getPlanes();
export const createPlan = (data) => groupsApi.createPlan(data);
export const confirmarPlan = (planId) =>
  groupsApi.confirmarPlan(planId);

export const fetchParticipaciones = () =>
  groupsApi.getParticipaciones();

export const responderParticipacion = (id, acepta) =>
  groupsApi.responderParticipacion(id, acepta);