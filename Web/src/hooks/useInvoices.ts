import { useState, useCallback } from 'react';
import axios from 'axios';
import type { DocumentSignatures } from './useQuotations';

export interface Invoice {
  id: string;
  client_id: string;
  customer_id?: string;
  contract_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  signatures?: DocumentSignatures;
  jobs?: Array<{ job_id: string; amount: number; job_number?: string; appliance_type?: string; reported_fault?: string }>;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listInvoices = useCallback(async (clientId: string, filters?: { status?: string; job_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ client_id: clientId });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.job_id) params.append('job_id', filters.job_id);

      const response = await axios.get(`${API_URL}/invoices?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setInvoices(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvoice = useCallback(async (clientId: string, invoiceId: string) => {
    try {
      const response = await axios.get(`${API_URL}/invoices/${invoiceId}?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching invoice:', err);
      return null;
    }
  }, []);

  const createInvoice = useCallback(async (clientId: string, data: { customer_id?: string; customer_name?: string; contract_id?: string; issue_date: string; due_date: string; job_amounts?: Array<{ job_id: string; amount: number }>; line_items?: Array<{ description: string; amount: number }>; notes?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/invoices`, { client_id: clientId, ...data }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const newInv = response.data.data;
      setInvoices([newInv, ...invoices]);
      return newInv;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [invoices]);

  const updateInvoice = useCallback(async (clientId: string, invoiceId: string, data: Partial<Invoice>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_URL}/invoices/${invoiceId}?client_id=${clientId}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updated = response.data.data;
      // The update response is a plain row without the customer join —
      // merge onto the existing entry so customer_name doesn't disappear.
      setInvoices(invoices.map(i => (i.id === invoiceId ? { ...i, ...updated } : i)));
      return updated;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [invoices]);

  const deleteInvoice = useCallback(async (clientId: string, invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/invoices/${invoiceId}?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setInvoices(invoices.filter(i => i.id !== invoiceId));
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [invoices]);

  const sendInvoice = useCallback(async (clientId: string, invoiceId: string) => {
    const response = await axios.post(`${API_URL}/invoices/${invoiceId}/send?client_id=${clientId}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data.data as { whatsappSent: boolean; whatsappError: string | null; emailError: string | null; hasWhatsapp: boolean };
  }, []);

  return { invoices, loading, error, listInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, sendInvoice };
};
