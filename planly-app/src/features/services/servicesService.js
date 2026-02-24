// src/features/services/servicesService.js

import { getCatalogo } from "../../services/servicesApi";

export const fetchCatalogo = async (filters) => {
  return await getCatalogo(filters);
};