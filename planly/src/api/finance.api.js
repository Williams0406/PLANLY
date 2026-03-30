import client from './client';

export const financeApi = {
  getMovimientos: () => client.get('/finance/movimientos/'),
  getServiciosPendientes: (planId) => client.get(`/finance/movimientos/servicios_pendientes/?plan_id=${planId}`),
  getPrestamoContexto: () => client.get('/finance/movimientos/prestamo_contexto/'),
  
  createMovimiento: (data) => client.post('/finance/movimientos/', data),
  
  getBalance: () => client.get('/finance/movimientos/balance/'),
  
  getPrestamos: () => client.get('/finance/prestamos/'),
  getDeudas: () => client.get('/finance/prestamos/deudas/'),
  
  createPrestamo: (data) => client.post('/finance/prestamos/', data),
  
  pagarPrestamo: (id, monto) =>
    client.post(`/finance/prestamos/${id}/pagar/`, { monto }),
};
