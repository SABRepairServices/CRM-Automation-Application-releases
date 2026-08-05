import { useState, useCallback } from 'react';
import axios from 'axios';

export interface Job {
  id: string;
  client_id: string;
  customer_id: string;
  customer_name?: string;
  appliance_type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  reported_fault?: string;
  scheduled_at?: string;
  status: 'new' | 'scheduled' | 'inspected' | 'quoted' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  technician_id?: string;
  diagnosis?: string;
  photo_count?: number;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listJobs = useCallback(async (clientId: string, filters?: { status?: string; technician_id?: string; customer_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ client_id: clientId });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.technician_id) params.append('technician_id', filters.technician_id);
      if (filters?.customer_id) params.append('customer_id', filters.customer_id);

      const response = await axios.get(`${API_URL}/jobs?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setJobs(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getJob = useCallback(async (clientId: string, jobId: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching job:', err);
      return null;
    }
  }, []);

  const createJob = useCallback(async (clientId: string, data: Partial<Job>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/jobs`, { client_id: clientId, ...data }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const newJob = response.data.data;
      setJobs([newJob, ...jobs]);
      return newJob;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobs]);

  const updateJob = useCallback(async (clientId: string, jobId: string, data: Partial<Job>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_URL}/jobs/${jobId}?client_id=${clientId}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updated = response.data.data;
      setJobs(jobs.map(j => (j.id === jobId ? { ...j, ...updated } : j)));
      return updated;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobs]);

  const deleteJob = useCallback(async (clientId: string, jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/jobs/${jobId}?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobs]);

  return { jobs, loading, error, listJobs, getJob, createJob, updateJob, deleteJob };
};
