import { useState, useCallback } from 'react';
import axios from 'axios';

export interface InspectionFinding {
  id?: string;
  description: string;
}

export interface InspectionReport {
  id: string;
  report_number: string;
  client_id: string;
  job_id: string;
  job_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  appliance_type?: string;
  inspected_by?: string;
  inspected_at?: string;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  notes?: string;
  status: 'draft' | 'final';
  findings?: InspectionFinding[];
  generated_quotation?: { id: string; quotation_number: string } | null;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useInspections = () => {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const listReports = useCallback(async (clientId: string, filters?: { job_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ client_id: clientId });
      if (filters?.job_id) params.append('job_id', filters.job_id);
      const response = await axios.get(`${API_URL}/inspections?${params}`, authHeader());
      setReports(response.data.data || []);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getReport = useCallback(async (clientId: string, reportId: string) => {
    const response = await axios.get(`${API_URL}/inspections/${reportId}?client_id=${clientId}`, authHeader());
    return response.data.data;
  }, []);

  const createReport = useCallback(
    async (
      clientId: string,
      data: { job_id: string; inspected_by?: string; findings: InspectionFinding[]; taxable_amount?: number; tax_rate?: number; notes?: string }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${API_URL}/inspections`, { client_id: clientId, ...data }, authHeader());
        const created = response.data.data;
        setReports([created, ...reports]);
        return created;
      } catch (err) {
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : String(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reports]
  );

  const updateReport = useCallback(
    async (clientId: string, reportId: string, data: Partial<InspectionReport>) => {
      const response = await axios.put(`${API_URL}/inspections/${reportId}?client_id=${clientId}`, data, authHeader());
      const updated = response.data.data;
      setReports(reports.map((r) => (r.id === reportId ? updated : r)));
      return updated;
    },
    [reports]
  );

  const sendReport = useCallback(async (clientId: string, reportId: string) => {
    const response = await axios.post(`${API_URL}/inspections/${reportId}/send?client_id=${clientId}`, {}, authHeader());
    return response.data.data as { whatsappSent: boolean; whatsappError: string | null; emailError: string | null; hasWhatsapp: boolean };
  }, []);

  return { reports, loading, error, listReports, getReport, createReport, updateReport, sendReport };
};
