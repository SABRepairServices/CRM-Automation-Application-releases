import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
} from 'axios';

// Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  timestamp?: string;
  [key: string]: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  status: string;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  profileId: string;
  profileUrl: string;
  followersCount: number;
  status: string;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  contentType: string;
  aiGenerated: boolean;
}

export interface Analytics {
  totalFollowers: number;
  scheduledPosts: number;
  publishedPosts: number;
  averageEngagement: number;
  totalAccounts: number;
  connectedAccounts: number;
  disconnectedAccounts: number;
}

// API Client Class
class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.refreshToken) {
            try {
              await this.refreshAccessToken();
              return this.instance(originalRequest);
            } catch (refreshError) {
              this.clearAuth();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );

    // Load stored tokens
    this.loadStoredTokens();
  }

  // Storage Methods
  private loadStoredTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Token Management
  private async refreshAccessToken() {
    // Implementation for token refresh (endpoint coming soon)
    console.warn('Token refresh not yet implemented');
  }

  // Health & System
  async checkHealth() {
    try {
      const response = await this.instance.get('/health');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getVersion() {
    const response = await this.instance.get('/version');
    return response.data;
  }

  // Authentication
  async register(email: string, password: string, fullName: string) {
    const response = await this.instance.post<ApiResponse>('/auth/register', {
      email,
      password,
      fullName,
    });

    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.instance.post<any>('/auth/login', {
      email,
      password,
    });

    if (response.data.accessToken && response.data.refreshToken) {
      this.saveTokens(response.data.accessToken, response.data.refreshToken);

      // Save user info
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response.data;
  }

  async getCurrentUser() {
    const response = await this.instance.get<ApiResponse>('/auth/me');
    return response.data;
  }

  async updateProfile(fullName: string, avatarUrl?: string) {
    const response = await this.instance.put<ApiResponse>('/auth/profile', {
      fullName,
      avatarUrl,
    });

    return response.data;
  }

  async getPreferences() {
    const response = await this.instance.get<ApiResponse>('/auth/preferences');
    return response.data;
  }

  async updatePreferences(
    theme: string,
    timezone: string,
    language: string,
    notificationsEnabled: boolean
  ) {
    const response = await this.instance.put<ApiResponse>('/auth/preferences', {
      theme,
      timezone,
      language,
      notificationsEnabled,
    });

    return response.data;
  }

  // Social Accounts
  async listAccounts() {
    const response = await this.instance.get<ApiResponse>('/accounts');
    return response.data;
  }

  async addAccount(accountData: any) {
    const response = await this.instance.post<ApiResponse>('/accounts', accountData);
    return response.data;
  }

  async getAccount(accountId: string) {
    const response = await this.instance.get<ApiResponse>(`/accounts/${accountId}`);
    return response.data;
  }

  async updateAccount(accountId: string, updates: any) {
    const response = await this.instance.put<ApiResponse>(`/accounts/${accountId}`, updates);
    return response.data;
  }

  async disconnectAccount(accountId: string) {
    const response = await this.instance.delete<ApiResponse>(`/accounts/${accountId}`);
    return response.data;
  }

  // Posts
  async listPosts(
    status?: string,
    limit: number = 20,
    offset: number = 0,
    sortBy: string = 'created_at'
  ) {
    const response = await this.instance.get<ApiResponse>('/posts', {
      params: { status, limit, offset, sortBy },
    });

    return response.data;
  }

  async createPost(postData: any) {
    const response = await this.instance.post<ApiResponse>('/posts', postData);
    return response.data;
  }

  async getPost(postId: string) {
    const response = await this.instance.get<ApiResponse>(`/posts/${postId}`);
    return response.data;
  }

  async updatePost(postId: string, updates: any) {
    const response = await this.instance.put<ApiResponse>(`/posts/${postId}`, updates);
    return response.data;
  }

  async deletePost(postId: string) {
    const response = await this.instance.delete<ApiResponse>(`/posts/${postId}`);
    return response.data;
  }

  async schedulePost(postId: string, scheduledAt: string, platforms: string[]) {
    const response = await this.instance.post<ApiResponse>(`/posts/${postId}/schedule`, {
      scheduledAt,
      platforms,
    });

    return response.data;
  }

  async getScheduledPosts(limit: number = 10) {
    const response = await this.instance.get<ApiResponse>('/posts/scheduled/list', {
      params: { limit },
    });

    return response.data;
  }

  // Analytics
  async getDashboardMetrics() {
    const response = await this.instance.get<ApiResponse>('/analytics/dashboard');
    return response.data;
  }

  async getAccountAnalytics(
    accountId: string,
    startDate: string,
    endDate: string
  ) {
    const response = await this.instance.get<ApiResponse>(
      `/analytics/accounts/${accountId}`,
      {
        params: { startDate, endDate },
      }
    );

    return response.data;
  }

  async getTopPosts(limit: number = 10) {
    const response = await this.instance.get<ApiResponse>('/analytics/top-posts', {
      params: { limit },
    });

    return response.data;
  }

  async recordAnalytics(accountId: string, analyticsData: any) {
    const response = await this.instance.post<ApiResponse>('/analytics/record', {
      accountId,
      analyticsData,
    });

    return response.data;
  }

  // Helper Methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getStoredUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}

// Export singleton instance
export const api = new ApiClient();

export default api;
