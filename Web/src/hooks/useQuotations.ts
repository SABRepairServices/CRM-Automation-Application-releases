import { useState, useCallback } from 'react';
import axios from 'axios';

export interface QuotationItem {
  id?: string;
  description: string;
  item_type?: 'part' | 'labour' | 'service';
  quantity: number;
  unit_price: number;
}

export type RepairType = 'on_site' | 'workshop' | 'inspection_only' | 'part_replacement' | 'service';

/** Signature boxes on the printed document. Keys differ per document type
 *  (a quotation is approved by the customer, an invoice is received by
 *  them), so this stays an open record rather than a fixed shape. */
export interface DocumentSignatures {
  [role: string]: { name?: string; date?: string } | undefined;
}

export interface Quotation {
  id: string;
  client_id: string;
  job_id: string;
  job_number?: string;
  appliance_type?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  quotation_number: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  labour_amount: number;
  parts_amount: number;
  discount_amount: number;
  vat_percent: number;
  total_amount: number;
  notes?: string;
  valid_until?: string;
  repair_type?: RepairType;
  signatures?: DocumentSignatures;
  approved_by?: string;
  approval_channel?: string;
  items?: QuotationItem[];
  generated_invoice?: { id: string; invoice_number: string } | null;
  created_at: string;
}

/** The customer/appliance detail the office types straight into the
 *  document form. The backend turns this into a real customer + job
 *  (see API/app/services/customerJobResolver.js) — no separate
 *  "create a job first" step. */
export interface DocumentJobContext {
  job_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_building?: string;
  customer_contact_person?: string;
  customer_location?: string;
  appliance_type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  reported_fault?: string;
  urgency?: 'low' | 'normal' | 'urgent';
  technician_id?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useQuotations = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listQuotations = useCallback(async (clientId: string, filters?: { status?: string; job_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ client_id: clientId });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.job_id) params.append('job_id', filters.job_id);

      const response = await axios.get(`${API_URL}/quotations?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setQuotations(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuotation = useCallback(async (clientId: string, quotationId: string) => {
    try {
      const response = await axios.get(`${API_URL}/quotations/${quotationId}?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching quotation:', err);
      return null;
    }
  }, []);

  const createQuotation = useCallback(async (clientId: string, data: DocumentJobContext & {
    items: QuotationItem[];
    discount_amount?: number;
    vat_percent?: number;
    notes?: string;
    valid_until?: string;
    repair_type?: RepairType;
    signatures?: DocumentSignatures;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/quotations`, { client_id: clientId, ...data }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const newQuot = response.data.data;
      setQuotations([newQuot, ...quotations]);
      return newQuot;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quotations]);

  const updateQuotation = useCallback(async (clientId: string, quotationId: string, data: Partial<Quotation>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_URL}/quotations/${quotationId}?client_id=${clientId}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updated = response.data.data;
      setQuotations(quotations.map(q => (q.id === quotationId ? { ...q, ...updated } : q)));
      return updated;
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quotations]);

  const deleteQuotation = useCallback(async (clientId: string, quotationId: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/quotations/${quotationId}?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setQuotations(quotations.filter(q => q.id !== quotationId));
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quotations]);

  const sendQuotation = useCallback(async (clientId: string, quotationId: string) => {
    const response = await axios.post(`${API_URL}/quotations/${quotationId}/send?client_id=${clientId}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data.data as { whatsappSent: boolean; whatsappError: string | null; emailError: string | null; hasWhatsapp: boolean };
  }, []);

  return { quotations, loading, error, listQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, sendQuotation };
};
