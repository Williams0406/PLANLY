import { create } from 'zustand';
import { financeApi } from '../api/finance.api';

export const useFinanceStore = create((set) => ({
  movimientos: [],
  balance: null,
  prestamos: [],
  isLoading: false,

  fetchBalance: async () => {
    try {
      const res = await financeApi.getBalance();
      set({ balance: res.data });
    } catch (e) {}
  },

  fetchMovimientos: async () => {
    set({ isLoading: true });
    try {
      const res = await financeApi.getMovimientos();
      set({ movimientos: res.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  fetchPrestamos: async () => {
    try {
      const res = await financeApi.getPrestamos();
      set({ prestamos: res.data });
    } catch (e) {}
  },

  addMovimiento: async (data) => {
    const res = await financeApi.createMovimiento(data);
    set((state) => ({ movimientos: [res.data, ...state.movimientos] }));
    return res.data;
  },
}));