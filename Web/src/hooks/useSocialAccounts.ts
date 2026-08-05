'use client';

import { useState, useCallback } from 'react';

export interface SocialAccount {
  id: string;
  client_id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'youtube';
  account_name: string;
  account_username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSocialAccounts() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [stats] = useState<any>(null); // TODO: wire up when stats endpoint is implemented
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  }, []);

  const getSelectedClientId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedClientId') || '';
    }
    return '';
  }, []);

  const listAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clientId = getSelectedClientId();
      const token = getToken();
      const response = await fetch(
        `${API_URL}/social-accounts?client_id=${clientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await response.json();
      if (json.error) {
        setError(json.error);
        setAccounts([]);
      } else {
        setAccounts(json.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching accounts');
    } finally {
      setLoading(false);
    }
  }, [getToken, API_URL, getSelectedClientId]);

  const getAccount = useCallback(
    async (accountId: string) => {
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(
          `${API_URL}/social-accounts/${accountId}?client_id=${clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await response.json();
        return json.error ? null : json.data;
      } catch (err) {
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId]
  );

  const createAccount = useCallback(
    async (data: Partial<SocialAccount>) => {
      setLoading(true);
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(`${API_URL}/social-accounts?client_id=${clientId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        const json = await response.json();
        if (json.error) {
          setError(json.error);
          return null;
        }
        setAccounts([json.data, ...accounts]);
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error creating account';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken, API_URL, getSelectedClientId, accounts]
  );

  const updateAccount = useCallback(
    async (accountId: string, data: Partial<SocialAccount>) => {
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(
          `${API_URL}/social-accounts/${accountId}?client_id=${clientId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }
        );
        const json = await response.json();
        if (json.error) {
          setError(json.error);
          return null;
        }
        setAccounts(accounts.map(a => (a.id === accountId ? json.data : a)));
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error updating account';
        setError(msg);
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId, accounts]
  );

  const connectFacebook = useCallback(async () => {
    setError(null);
    try {
      const clientId = getSelectedClientId();
      const token = getToken();
      const response = await fetch(`${API_URL}/social-accounts/connect/facebook?client_id=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      window.location.href = json.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error starting Facebook connection');
    }
  }, [getToken, API_URL, getSelectedClientId]);

  const deleteAccount = useCallback(
    async (accountId: string) => {
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(
          `${API_URL}/social-accounts/${accountId}?client_id=${clientId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await response.json();
        if (json.error) {
          setError(json.error);
          return null;
        }
        setAccounts(accounts.filter(a => a.id !== accountId));
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error deleting account';
        setError(msg);
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId, accounts]
  );

  return {
    accounts,
    stats,
    loading,
    error,
    listAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    connectFacebook,
  };
}
