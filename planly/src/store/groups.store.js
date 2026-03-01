import { create } from 'zustand';
import { groupsApi } from '../api/groups.api';

export const useGroupsStore = create((set, get) => ({
  grupos: [],
  planes: [],
  isLoading: false,
  error: null,

  fetchGrupos: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await groupsApi.getGrupos();
      set({ grupos: res.data, isLoading: false });
    } catch (e) {
      set({ error: 'Error al cargar grupos', isLoading: false });
    }
  },

  fetchPlanes: async () => {
    set({ isLoading: true });
    try {
      const res = await groupsApi.getPlanes();
      set({ planes: res.data, isLoading: false });
    } catch (e) {
      set({ error: 'Error al cargar planes', isLoading: false });
    }
  },

  createGrupo: async (data) => {
    const res = await groupsApi.createGrupo(data);
    set((state) => ({ grupos: [res.data, ...state.grupos] }));
    return res.data;
  },

  createPlan: async (data) => {
    const res = await groupsApi.createPlan(data);
    set((state) => ({ planes: [res.data, ...state.planes] }));
    return res.data;
  },
}));