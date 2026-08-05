import { useState, useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for making API requests
 * Handles loading, error, and data states automatically
 */
export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      apiCall: () => Promise<ApiResponse<T>>,
      onSuccess?: (data: T) => void,
      onError?: (error: string) => void
    ) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await apiCall();

        if (response.status === 'success' && response.data) {
          setState({ data: response.data, loading: false, error: null });

          if (onSuccess) {
            onSuccess(response.data);
          }

          return response.data;
        } else {
          const errorMsg = response.message || 'Unknown error occurred';
          setState({ data: null, loading: false, error: errorMsg });

          if (onError) {
            onError(errorMsg);
          }

          return null;
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error.message || 'Unknown error';
        setState({ data: null, loading: false, error: errorMsg });

        if (onError) {
          onError(errorMsg);
        }

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for user authentication
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [user, setUser] = useState(api.getStoredUser());

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);

      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const response = await api.register(email, password, fullName);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    api.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();

      if (response.user) {
        setUser(response.user);
        return response.user;
      }

      return null;
    } catch (error) {
      return null;
    }
  }, []);

  return {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    getCurrentUser,
  };
}

/**
 * Hook for social accounts management
 */
export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.listAccounts();

      if (response.accounts) {
        setAccounts(response.accounts);
        return response.accounts;
      }

      return [];
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to load accounts';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (accountData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.addAccount(accountData);

      if (response.account) {
        setAccounts((prev) => [...prev, response.account]);
        return response.account;
      }

      return null;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to add account';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectAccount = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);

    try {
      await api.disconnectAccount(accountId);
      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
      return true;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to disconnect account';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    accounts,
    loading,
    error,
    listAccounts,
    addAccount,
    disconnectAccount,
  };
}

/**
 * Hook for posts management
 */
export function usePosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPosts, setTotalPosts] = useState(0);

  const listPosts = useCallback(
    async (status?: string, limit: number = 20, offset: number = 0) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.listPosts(status, limit, offset);

        if (response.posts) {
          setPosts(response.posts);
          setTotalPosts(response.pagination?.total || 0);
          return response.posts;
        }

        return [];
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to load posts';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createPost = useCallback(async (postData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.createPost(postData);

      if (response.post) {
        setPosts((prev) => [response.post, ...prev]);
        return response.post;
      }

      return null;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create post';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePost = useCallback(async (postId: string, updates: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.updatePost(postId, updates);

      if (response.post) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? response.post : p))
        );
        return response.post;
      }

      return null;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to update post';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    setLoading(true);
    setError(null);

    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      return true;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to delete post';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const schedulePost = useCallback(
    async (postId: string, scheduledAt: string, platforms: string[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.schedulePost(postId, scheduledAt, platforms);

        if (response.post) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? response.post : p))
          );
          return response.post;
        }

        return null;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to schedule post';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    posts,
    totalPosts,
    loading,
    error,
    listPosts,
    createPost,
    updatePost,
    deletePost,
    schedulePost,
  };
}

/**
 * Hook for analytics
 */
export function useAnalytics() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getDashboardMetrics();

      if (response.metrics) {
        setMetrics(response.metrics);
        return response.metrics;
      }

      return null;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to load metrics';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountAnalytics = useCallback(
    async (accountId: string, startDate: string, endDate: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getAccountAnalytics(accountId, startDate, endDate);

        if (response.analytics) {
          return response.analytics;
        }

        return [];
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to load analytics';
        setError(errorMsg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getTopPosts = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getTopPosts(limit);

      if (response.posts) {
        return response.posts;
      }

      return [];
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to load top posts';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    metrics,
    loading,
    error,
    getDashboardMetrics,
    getAccountAnalytics,
    getTopPosts,
  };
}

export default useApi;
