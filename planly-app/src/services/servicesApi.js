// src/services/servicesApi.js

import api from "./api";

export const getCatalogo = async (params = {}) => {
  const response = await api.get("/services/catalogo/", {
    params,
  });
  return response.data;
};