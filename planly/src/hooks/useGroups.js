import { useState, useCallback } from 'react';
import { groupsApi } from '../api/groups.api';

export function useGroups() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await groupsApi.getGrupos();
      setGrupos(res.data);
    } catch (e) {
      setError('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGrupo = useCallback(async (data) => {
    const res = await groupsApi.createGrupo(data);
    setGrupos((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  return { grupos, loading, error, fetchGrupos, createGrupo };
}