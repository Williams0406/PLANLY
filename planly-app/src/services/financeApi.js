// src/services/financeApi.js

import api from "./api";

export const getMovimientos = async () => {
  const response = await api.get("/finance/movimientos/");
  return response.data;
};

export const createMovimiento = async (data) => {
  const response = await api.post("/finance/movimientos/", data);
  return response.data;
};

export const getBalance = async () => {
  const response = await api.get("/finance/movimientos/balance/");
  return response.data;
};

export const getPrestamos = async () => {
  const response = await api.get("/finance/prestamos/");
  return response.data;
};

export const createPrestamo = async (data) => {
  const response = await api.post("/finance/prestamos/", data);
  return response.data;
};

export const pagarPrestamo = async (id, monto) => {
  const response = await api.post(`/finance/prestamos/${id}/pagar/`, {
    monto,
  });
  return response.data;
};