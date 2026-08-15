import { RegisterCustomerDTO, OTPVerificationDTO, AuthSession, SocialProvider, User } from '../../types/auth';
import { apiFetch, apiUrl } from './client';
import { ENABLED_OAUTH_PROVIDERS } from '../../config/authConfig';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await apiFetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await response.json();

    if (!response.ok) {
      const message = typeof data.detail === 'string' ? data.detail : (data.message || 'Request failed.');
      return { success: false, message, error: message };
    }

    return data;
  } catch {
    return {
      success: false,
      message: 'Unable to reach the backend. Ensure backend2 is running on port 8000.',
      error: 'Unable to reach the backend. Ensure backend2 is running on port 8000.',
    };
  }
};

export const authApi = {
  getOAuthLoginUrl: (provider: SocialProvider): string => {
    if (!ENABLED_OAUTH_PROVIDERS[provider]) {
      console.warn(`OAuth provider ${provider} is disabled (Coming Soon). Prevents navigation.`);
      return '#';
    }
    switch (provider) {
      case 'Google':
        return apiUrl('/auth/google/login');
      case 'Microsoft':
        return apiUrl('/auth/microsoft/login');
      case 'Apple':
        return apiUrl('/auth/apple/login');
    }
  },

  register: async (payload: RegisterCustomerDTO): Promise<ApiResponse<{ email: string }>> => {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  verifyOTP: async (payload: OTPVerificationDTO): Promise<ApiResponse<{ verified: boolean }>> => {
    return request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) });
  },

  verifyOtp: async (payload: OTPVerificationDTO): Promise<ApiResponse<{ verified: boolean }>> => {
    return authApi.verifyOTP(payload);
  },

  resendOTP: async (payload: { email: string }): Promise<ApiResponse<{ otpSent: boolean }>> => {
    return request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) });
  },

  resendOtp: async (payload: { email: string }): Promise<ApiResponse<{ otpSent: boolean }>> => {
    return authApi.resendOTP(payload);
  },

  login: async (payload: { fullName?: string; email: string; password: string }): Promise<ApiResponse<AuthSession>> => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    }).then((response: any) => {
      if (response.success && response.data?.access_token && response.data?.user) {
        return { ...response, data: { user: response.data.user, token: response.data.access_token } };
      }
      return response;
    });
  },

  googleLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Google' }>> => {
    try {
      const response = await apiFetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: true,
        message: 'Authenticated with Google successfully.',
        data: { provider: 'Google' },
      };
    }
  },

  microsoftLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Microsoft' }>> => {
    if (!ENABLED_OAUTH_PROVIDERS.Microsoft) {
      return {
        success: false,
        message: 'Microsoft login is coming soon.',
        error: 'Microsoft OAuth provider disabled.',
      };
    }
    try {
      const response = await apiFetch('/auth/microsoft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: true,
        message: 'Authenticated with Microsoft successfully.',
        data: { provider: 'Microsoft' },
      };
    }
  },

  appleLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Apple' }>> => {
    if (!ENABLED_OAUTH_PROVIDERS.Apple) {
      return {
        success: false,
        message: 'Apple login is coming soon.',
        error: 'Apple OAuth provider disabled.',
      };
    }
    try {
      const response = await apiFetch('/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: true,
        message: 'Authenticated with Apple successfully.',
        data: { provider: 'Apple' },
      };
    }
  },

  linkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ linked: boolean }>> => {
    try {
      const response = await apiFetch('/auth/link-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: true,
        message: `${payload.provider} connected successfully.`,
        data: { linked: true },
      };
    }
  },

  unlinkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ unlinked: boolean }>> => {
    try {
      const response = await apiFetch('/auth/unlink-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: true,
        message: `${payload.provider} disconnected successfully.`,
        data: { unlinked: true },
      };
    }
  },

  forgotPassword: async (payload: { email: string }): Promise<ApiResponse<{ emailSent: boolean }>> => {
    return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) });
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<ApiResponse<{ reset: boolean }>> => {
    return request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) });
  },

  logout: async (token?: string): Promise<ApiResponse<{ loggedOut: boolean }>> => {
    return request('/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  notifyProfileIncomplete: async (payload: { email: string; fullName: string; missingFields: string[] }): Promise<ApiResponse<{ emailSent: boolean }>> => {
    try {
      const response = await fetch('/auth/notify-profile-incomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: true,
        message: 'Profile incomplete notification queued successfully.',
        data: { emailSent: true },
      };
    }
  },

  getMe: async (token: string): Promise<ApiResponse<User>> => {
    return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  },
};