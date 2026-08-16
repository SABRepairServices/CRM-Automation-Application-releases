import { useState, useCallback } from 'react';
import axios from 'axios';
import type { DocumentSignatures } from './useQuotations';

export type PaymentTerms = 'due_on_receipt' | 'net_7' | 'net_15' | 'net_30' | 'end_of_month';

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  due_on_receipt: 'Due on Receipt',
  net_7: 'Net 7 Days',
  net_15: 'Net 15 Days',
  net_30: 'Net 30 Days',
  end_of_month: 'End of Month',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** A completed job eligible to be billed on a monthly statement — i.e.
 *  finished in the chosen month and not already on another one. */
export interface AvailableJob {
  job_id: string;
  job_number?: string;
  completed_at?: string;
  appliance_type?: string;
  serial_number?: string;
  reported_fault?: string;
  customer_name?: string;
  suggested_amount: number;
}

export interface MonthlyInvoiceJob {
  job_id: string;
  amount: number;
  received_amount: number;
  job_number?: string;
  completed_at?: string;
  appliance_type?: string;
  serial_number?: string;
  reported_fault?: string;
}

export interface MonthlyInvoice {
  id: string;
  client_id: string;
  invoice_number: string;
  contract_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  contact_person?: string;
  customer_address?: string;
  panel_account_number?: string;
  contract_name?: string;
  month: number;
  year: number;
  payment_terms: PaymentTerms;
  prepared_by?: string;
  to_email?: string;
  cc_email?: string;
  subtotal: number;
  total_received: number;
  total_pending: number;
  status: 'draft' | 'sent' | 'paid';
  notes?: string;
  signatures?: DocumentSignatures;
  jobs?: MonthlyInvoiceJob[];
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useMonthlyInvoices = () => {
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const listMonthlyInvoices = useCallback(async (clientId: string, filters?: { status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ client_id: clientId });
      if (filters?.status) params.append('status', filters.status);
      const response = await axios.get(`${API_URL}/monthly-invoices?${params}`, authHeader());
      setInvoices(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMonthlyInvoice = useCallback(async (clientId: string, invoiceId: string) => {
    try {
      const response = await axios.get(`${API_URL}/monthly-invoices/${invoiceId}?client_id=${clientId}`, authHeader());
      return response.data.data as MonthlyInvoice;
    } catch (err) {
      console.error('Error fetching monthly invoice:', err);
      return null;
    }
  }, []);

  const listAvailableJobs = useCallback(
    async (clientId: string, opts: { month: number; year: number; customer_id?: string; contract_id?: string }) => {
      const params = new URLSearchParams({ client_id: clientId, month: String(opts.month), year: String(opts.year) });
      if (opts.customer_id) params.append('customer_id', opts.customer_id);
      if (opts.contract_id) params.append('contract_id', opts.contract_id);
      const response = await axios.get(`${API_URL}/monthly-invoices/available-jobs?${params}`, authHeader());
      return (response.data.data || []) as AvailableJob[];
    },
    []
  );

  const createMonthlyInvoice = useCallback(
    async (
      clientId: string,
      data: {
        customer_id?: string;
        contract_id?: string;
        month: number;
        year: number;
        payment_terms?: PaymentTerms;
        prepared_by?: string;
        to_email?: string;
        cc_email?: string;
        notes?: string;
        job_amounts: Array<{ job_id: string; amount: number; received_amount?: number }>;
      }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${API_URL}/monthly-invoices`, { client_id: clientId, ...data }, authHeader());
        const created = response.data.data;
        setInvoices((prev) => [created, ...prev]);
        return created as MonthlyInvoice;
      } catch (err) {
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateMonthlyInvoice = useCallback(async (clientId: string, invoiceId: string, data: Partial<MonthlyInvoice>) => {
    const response = await axios.put(`${API_URL}/monthly-invoices/${invoiceId}?client_id=${clientId}`, data, authHeader());
    const updated = response.data.data;
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, ...updated } : i)));
    return updated as MonthlyInvoice;
  }, []);

  const deleteMonthlyInvoice = useCallback(async (clientId: string, invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/monthly-invoices/${invoiceId}?client_id=${clientId}`, authHeader());
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMonthlyInvoice = useCallback(async (clientId: string, invoiceId: string) => {
    const response = await axios.post(`${API_URL}/monthly-invoices/${invoiceId}/send?client_id=${clientId}`, {}, authHeader());
    return response.data.data as { whatsappSent: boolean; whatsappError: string | null; emailError: string | null; hasWhatsapp: boolean };
  }, []);

  return {
    invoices,
    loading,
    error,
    listMonthlyInvoices,
    getMonthlyInvoice,
    listAvailableJobs,
    createMonthlyInvoice,
    updateMonthlyInvoice,
    deleteMonthlyInvoice,
    sendMonthlyInvoice,
  };
};
