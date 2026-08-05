import { useState, useCallback } from 'react';
import axios from 'axios';

export interface Client {
  id: string;
  name: string;
  business_type?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
  brand_color?: string;
  billing_email?: string;
  notes?: string;
  is_active: boolean;
  subscription: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setClients(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getClient = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/clients/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching client:', err);
      return null;
    }
  }, []);

  const createClient = useCallback(async (data: Partial<Client>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/clients`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const newClient = response.data.data;
      setClients([newClient, ...clients]);
      return newClient;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_URL}/clients/${id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updated = response.data.data;
      setClients(clients.map(c => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clients]);

  const deleteClient = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/clients/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setClients(clients.filter(c => c.id !== id));
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clients]);

  return { clients, loading, error, listClients, getClient, createClient, updateClient, deleteClient };
};
