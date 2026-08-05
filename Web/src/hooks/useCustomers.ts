import { useState, useCallback } from 'react';
import axios from 'axios';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  area?: string;
  address?: string;
  source: string;
  status: 'new' | 'contacted' | 'booked' | 'active' | 'done' | 'lost';
  billing_type?: 'individual' | 'contractor';
  notes?: string;
  created_at: string;
}

export interface CustomerStats {
  total: number;
  new_count: number;
  booked_count: number;
  done_count: number;
  sources: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List customers
  const listCustomers = useCallback(
    async (options?: { clientId?: string; status?: string; source?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const clientId = options?.clientId || localStorage.getItem('selectedClientId');
        if (!clientId) {
          setError('No client selected');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({ client_id: clientId });
        if (options?.status) params.append('status', options.status);
        if (options?.source) params.append('source', options.source);

        const response = await axios.get(`${API_URL}/customers?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setCustomers(response.data.data || []);
      } catch (err) {
        const message = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get single customer
  const getCustomer = useCallback(
    async (customerId: string, clientId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const client = clientId || localStorage.getItem('selectedClientId');
        if (!client) throw new Error('No client selected');
        const response = await axios.get(`${API_URL}/customers/${customerId}?client_id=${client}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return response.data.data;
      } catch (err) {
        const message = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create customer
  const createCustomer = useCallback(
    async (data: Partial<Customer>, clientId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const client = clientId || localStorage.getItem('selectedClientId');
        if (!client) throw new Error('No client selected');
        const response = await axios.post(
          `${API_URL}/customers?client_id=${client}`,
          data,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        const newCustomer = response.data.data;
        setCustomers([newCustomer, ...customers]);
        return newCustomer;
      } catch (err) {
        const message = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [customers]
  );

  // Update customer
  const updateCustomer = useCallback(
    async (customerId: string, data: Partial<Customer>, clientId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const client = clientId || localStorage.getItem('selectedClientId');
        if (!client) throw new Error('No client selected');
        const response = await axios.put(
          `${API_URL}/customers/${customerId}?client_id=${client}`,
          data,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        const updated = response.data.data;
        setCustomers(customers.map(c => (c.id === customerId ? updated : c)));
        return updated;
      } catch (err) {
        const message = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [customers]
  );

  // Delete customer
  const deleteCustomer = useCallback(
    async (customerId: string, clientId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const client = clientId || localStorage.getItem('selectedClientId');
        if (!client) throw new Error('No client selected');
        await axios.delete(`${API_URL}/customers/${customerId}?client_id=${client}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setCustomers(customers.filter(c => c.id !== customerId));
      } catch (err) {
        const message = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [customers]
  );

  // Get stats
  const getStats = useCallback(async (clientId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const client = clientId || localStorage.getItem('selectedClientId');
      if (!client) throw new Error('No client selected');
      const response = await axios.get(`${API_URL}/customers/stats/overview?client_id=${client}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStats(response.data.data);
      return response.data.data;
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk import
  const bulkImport = useCallback(
    async (customersList: Array<Partial<Customer>>, clientId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const client = clientId || localStorage.getItem('selectedClientId');
        if (!client) throw new Error('No client selected');
        const response = await axios.post(
          `${API_URL}/customers/bulk?client_id=${client}`,
          { customers: customersList },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        await listCustomers({ clientId: client });
        return response.data;
      } catch (err) {
        const message = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listCustomers]
  );

  return {
    customers,
    stats,
    loading,
    error,
    listCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getStats,
    bulkImport,
  };
};
