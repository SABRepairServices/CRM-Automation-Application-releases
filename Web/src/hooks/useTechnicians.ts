import { useState, useCallback } from 'react';
import axios from 'axios';

export interface Technician {
  id: string;
  client_id: string;
  name: string;
  phone: string;
  email?: string;
  speciality?: string;
  is_active: boolean;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useTechnicians = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listTechnicians = useCallback(async (clientId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const client = clientId || localStorage.getItem('selectedClientId');
      if (!client) {
        setError('No client selected');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/technicians?client_id=${client}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTechnicians(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTechnician = useCallback(async (data: Partial<Technician>, clientId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const client = clientId || localStorage.getItem('selectedClientId');
      if (!client) throw new Error('No client selected');

      const response = await axios.post(`${API_URL}/technicians`, { client_id: client, ...data }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const newTech = response.data.data;
      setTechnicians([newTech, ...technicians]);
      return newTech;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [technicians]);

  const deleteTechnician = useCallback(async (id: string, clientId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const client = clientId || localStorage.getItem('selectedClientId');
      if (!client) throw new Error('No client selected');

      await axios.delete(`${API_URL}/technicians/${id}?client_id=${client}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTechnicians(technicians.filter(t => t.id !== id));
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [technicians]);

  return { technicians, loading, error, listTechnicians, createTechnician, deleteTechnician };
};
