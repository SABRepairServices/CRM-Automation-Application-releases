import { useState, useCallback } from 'react';
import axios from 'axios';

export interface CallLog {
  id: string;
  client_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  job_id?: string;
  technician_id?: string;
  technician_name?: string;
  direction: 'inbound' | 'outbound';
  purpose: 'reminder' | 'follow_up' | 'inquiry' | 'complaint' | 'quotation_discussion' | 'other';
  notes?: string;
  duration_minutes?: number;
  called_at: string;
  created_at: string;
}

export interface CallStats {
  total: number;
  inbound_count: number;
  outbound_count: number;
  today_count: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useCalls = () => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const listCalls = useCallback(async (clientId: string, filters?: { customer_id?: string; job_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ client_id: clientId });
      if (filters?.customer_id) params.append('customer_id', filters.customer_id);
      if (filters?.job_id) params.append('job_id', filters.job_id);
      const response = await axios.get(`${API_URL}/calls?${params}`, authHeader());
      setCalls(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async (clientId: string) => {
    try {
      const response = await axios.get(`${API_URL}/calls/stats/overview?client_id=${clientId}`, authHeader());
      setStats(response.data.data);
    } catch {
      // stats are a nice-to-have, ignore failures
    }
  }, []);

  const createCall = useCallback(
    async (
      clientId: string,
      data: { customer_id: string; job_id?: string; technician_id?: string; direction: 'inbound' | 'outbound'; purpose: string; notes?: string; duration_minutes?: number; called_at?: string }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${API_URL}/calls?client_id=${clientId}`, data, authHeader());
        const created = response.data.data;
        setCalls([created, ...calls]);
        return created;
      } catch (err) {
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [calls]
  );

  const deleteCall = useCallback(
    async (clientId: string, callId: string) => {
      await axios.delete(`${API_URL}/calls/${callId}?client_id=${clientId}`, authHeader());
      setCalls(calls.filter((c) => c.id !== callId));
    },
    [calls]
  );

  return { calls, stats, loading, error, listCalls, getStats, createCall, deleteCall };
};
