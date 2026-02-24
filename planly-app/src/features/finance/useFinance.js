// src/features/finance/useFinance.js

import { useEffect, useState } from "react";
import * as financeService from "./financeService";

export const useFinance = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [balance, setBalance] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMovimientos = async () => {
    try {
      setLoading(true);
      const data = await financeService.fetchMovimientos();
      setMovimientos(data);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    const data = await financeService.fetchBalance();
    setBalance(data);
  };

  const loadPrestamos = async () => {
    const data = await financeService.fetchPrestamos();
    setPrestamos(data);
  };

  useEffect(() => {
    loadMovimientos();
    loadBalance();
    loadPrestamos();
  }, []);

  return {
    movimientos,
    balance,
    prestamos,
    loading,
    createMovimiento: financeService.createMovimiento,
    createPrestamo: financeService.createPrestamo,
    pagarPrestamo: financeService.pagarPrestamo,
  };
};