'use client';

import { useState, useCallback } from 'react';

export interface SocialPost {
  id: string;
  client_id: string;
  social_account_id: string;
  content: string;
  media_urls: string[];
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSocialPosts() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const [posts, setPosts] = useState<SocialPost[]>([]);
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

  const listPosts = useCallback(
    async (filters?: { accountId?: string; status?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        let url = `${API_URL}/posts?client_id=${clientId}`;
        if (filters?.accountId) url += `&accountId=${filters.accountId}`;
        if (filters?.status) url += `&status=${filters.status}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        if (json.error) {
          setError(json.error);
          setPosts([]);
        } else {
          setPosts(json.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching posts');
      } finally {
        setLoading(false);
      }
    },
    [getToken, API_URL, getSelectedClientId]
  );

  const getPost = useCallback(
    async (postId: string) => {
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(`${API_URL}/posts/${postId}?client_id=${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        return json.error ? null : json.data;
      } catch (err) {
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId]
  );

  const createPost = useCallback(
    async (data: Partial<SocialPost>) => {
      setLoading(true);
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(`${API_URL}/posts?client_id=${clientId}`, {
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
        setPosts([json.data, ...posts]);
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error creating post';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken, API_URL, getSelectedClientId, posts]
  );

  const updatePost = useCallback(
    async (postId: string, data: Partial<SocialPost>) => {
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(`${API_URL}/posts/${postId}?client_id=${clientId}`, {
          method: 'PUT',
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
        setPosts(posts.map(p => (p.id === postId ? json.data : p)));
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error updating post';
        setError(msg);
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId, posts]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(`${API_URL}/posts/${postId}?client_id=${clientId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        if (json.error) {
          setError(json.error);
          return null;
        }
        setPosts(posts.filter(p => p.id !== postId));
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error deleting post';
        setError(msg);
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId, posts]
  );

  const publishPost = useCallback(
    async (postId: string) => {
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(`${API_URL}/posts/${postId}/publish?client_id=${clientId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        if (json.error) {
          setError(json.error);
          return null;
        }
        setPosts(posts.map(p => (p.id === postId ? json.data : p)));
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error publishing post';
        setError(msg);
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId, posts]
  );

  const schedulePost = useCallback(
    async (postId: string, scheduledAt: string) => {
      setError(null);
      try {
        const clientId = getSelectedClientId();
        const token = getToken();
        const response = await fetch(`${API_URL}/posts/${postId}/schedule?client_id=${clientId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ scheduledAt }),
        });
        const json = await response.json();
        if (json.error) {
          setError(json.error);
          return null;
        }
        setPosts(posts.map(p => (p.id === postId ? json.data : p)));
        return json.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error scheduling post';
        setError(msg);
        return null;
      }
    },
    [getToken, API_URL, getSelectedClientId, posts]
  );

  return {
    posts,
    stats,
    loading,
    error,
    listPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    schedulePost,
  };
}
