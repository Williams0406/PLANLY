// src/features/services/useServices.js

import { useEffect, useState } from "react";
import * as servicesService from "./servicesService";

export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadServices = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await servicesService.fetchCatalogo(filters);
      setServices(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return {
    services,
    loading,
    loadServices,
  };
};