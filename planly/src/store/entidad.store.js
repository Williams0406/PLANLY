import { create } from 'zustand';
import { entidadApi } from '../api/entidad.api';

export const useEntidadStore = create((set, get) => ({
  perfil: null,
  servicios: [],
  isLoading: false,
  error: null,

  fetchPerfil: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await entidadApi.getPerfil();
      const perfil = res.data.length > 0 ? res.data[0] : null;
      set({ perfil, isLoading: false });
      return perfil;
    } catch (e) {
      set({ error: 'Error al cargar perfil', isLoading: false });
      return null;
    }
  },

  createPerfil: async (data) => {
    const res = await entidadApi.createPerfil(data);
    set({ perfil: res.data });
    return res.data;
  },

  fetchServicios: async () => {
    set({ isLoading: true });
    try {
      const res = await entidadApi.getMisServicios();
      set({ servicios: res.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  createServicio: async (data) => {
    const res = await entidadApi.createServicio(data);
    set((state) => ({ servicios: [res.data, ...state.servicios] }));
    return res.data;
  },

  updateServicio: async (id, data) => {
    const res = await entidadApi.updateServicio(id, data);
    set((state) => ({
      servicios: state.servicios.map((s) =>
        s.id === id ? res.data : s
      ),
    }));
    return res.data;
  },

  deleteServicio: async (id) => {
    await entidadApi.deleteServicio(id);
    set((state) => ({
      servicios: state.servicios.filter((s) => s.id !== id),
    }));
  },

  togglePromocion: async (id, activar) => {
    if (activar) {
      await entidadApi.activarPromocion(id);
    } else {
      await entidadApi.desactivarPromocion(id);
    }
    set((state) => ({
      servicios: state.servicios.map((s) =>
        s.id === id ? { ...s, tiene_promocion: activar } : s
      ),
    }));
  },
}));