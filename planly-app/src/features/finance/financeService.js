// src/features/finance/financeService.js

import * as financeApi from "../../services/financeApi";

export const fetchMovimientos = () => financeApi.getMovimientos();
export const createMovimiento = (data) =>
  financeApi.createMovimiento(data);
export const fetchBalance = () => financeApi.getBalance();

export const fetchPrestamos = () => financeApi.getPrestamos();
export const createPrestamo = (data) =>
  financeApi.createPrestamo(data);
export const pagarPrestamo = (id, monto) =>
  financeApi.pagarPrestamo(id, monto);