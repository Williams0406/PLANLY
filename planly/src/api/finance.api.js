import client from './client';

export const financeApi = {
  getMovimientos: () => client.get('/finance/movimientos/'),
  
  createMovimiento: (data) => client.post('/finance/movimientos/', data),
  
  getBalance: () => client.get('/finance/movimientos/balance/'),
  
  getPrestamos: () => client.get('/finance/prestamos/'),
  
  createPrestamo: (data) => client.post('/finance/prestamos/', data),
  
  pagarPrestamo: (id, monto) =>
    client.post(`/finance/prestamos/${id}/pagar/`, { monto }),
};