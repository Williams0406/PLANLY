// src/features/groups/useGroups.js

import { useEffect, useState } from "react";
import * as groupsService from "./groupsService";

export const useGroups = () => {
  const [grupos, setGrupos] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const data = await groupsService.fetchGrupos();
      setGrupos(data);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanes = async () => {
    try {
      setLoading(true);
      const data = await groupsService.fetchPlanes();
      setPlanes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrupos();
    loadPlanes();
  }, []);

  return {
    grupos,
    planes,
    loading,
    loadGrupos,
    loadPlanes,
    createGrupo: groupsService.createGrupo,
    createPlan: groupsService.createPlan,
    confirmarPlan: groupsService.confirmarPlan,
  };
};