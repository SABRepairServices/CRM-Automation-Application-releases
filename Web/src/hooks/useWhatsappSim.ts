import { useState, useCallback } from 'react';
import axios from 'axios';

export interface SimMessage {
  id: string;
  client_id: string | null;
  direction: 'inbound' | 'outbound';
  from_number: string | null;
  to_number: string | null;
  body: string | null;
  raw_payload: { dryRunDocument?: string; bytes?: number } | null;
  created_at: string;
}

export interface SimThread {
  id: string;
  job_id: string;
  stage: string;
  status: string;
  document_type: string | null;
  customer_whatsapp: string | null;
  technician_whatsapp: string | null;
  customer_name: string | null;
  job_number: string | null;
  appliance_type: string | null;
  job_status: string | null;
  updated_at: string;
}

export interface SimTechnician {
  id: string;
  name: string;
  phone: string;
  client_id: string;
}

export interface SimStatus {
  dryRun: boolean;
  liveCredentials: boolean;
  verifyTokenSet: boolean;
  technicians: SimTechnician[];
  clients: Array<{ id: string; name: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useWhatsappSim = () => {
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [threads, setThreads] = useState<SimThread[]>([]);
  const [status, setStatus] = useState<SimStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const loadStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/whatsapp-sim/status`, authHeader());
      setStatus(res.data.data);
      return res.data.data as SimStatus;
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : String(err));
      return null;
    }
  }, []);

  const loadConversation = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/whatsapp-sim/conversation`, authHeader());
      setMessages(res.data.data || []);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : String(err));
    }
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/whatsapp-sim/threads`, authHeader());
      setThreads(res.data.data || []);
    } catch {
      // threads are supplementary; a failure here shouldn't blank the chat
    }
  }, []);

  const sendInbound = useCallback(
    async (from: string, body: string, type: string = 'text', profileName?: string) => {
      setSending(true);
      setError(null);
      try {
        await axios.post(`${API_URL}/whatsapp-sim/inbound`, { from, body, type, profileName }, authHeader());
        await loadConversation();
        await loadThreads();
      } catch (err) {
        setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : String(err));
      } finally {
        setSending(false);
      }
    },
    [loadConversation, loadThreads]
  );

  const reset = useCallback(
    async (clientId: string) => {
      setSending(true);
      try {
        await axios.post(`${API_URL}/whatsapp-sim/reset`, { client_id: clientId }, authHeader());
        await loadConversation();
        await loadThreads();
      } catch (err) {
        setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : String(err));
      } finally {
        setSending(false);
      }
    },
    [loadConversation, loadThreads]
  );

  return { messages, threads, status, sending, error, loadStatus, loadConversation, loadThreads, sendInbound, reset };
};
