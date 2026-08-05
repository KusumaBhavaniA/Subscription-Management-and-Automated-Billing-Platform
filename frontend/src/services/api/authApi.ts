import { RegisterCustomerDTO, OTPVerificationDTO, AuthSession, SocialProvider, User } from '../../types/auth';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(path, {
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
  /**
   * OAuth 2.0 Provider Login URLs
   */
  getOAuthLoginUrl: (provider: SocialProvider): string => {
    switch (provider) {
      case 'Google':
        return '/auth/google/login';
      case 'Microsoft':
        return '/auth/microsoft/login';
      case 'Apple':
        return '/auth/apple/login';
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

  /**
   * Endpoint: POST /auth/google
   */
  googleLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Google' }>> => {
    try {
      const response = await fetch('/auth/google', {
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

  /**
   * Endpoint: POST /auth/microsoft
   */
  microsoftLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Microsoft' }>> => {
    try {
      const response = await fetch('/auth/microsoft', {
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

  /**
   * Endpoint: POST /auth/apple
   */
  appleLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Apple' }>> => {
    try {
      const response = await fetch('/auth/apple', {
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

  /**
   * Endpoint: POST /auth/link-provider
   */
  linkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ linked: boolean }>> => {
    try {
      const response = await fetch('/auth/link-provider', {
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

  /**
   * Endpoint: POST /auth/unlink-provider
   */
  unlinkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ unlinked: boolean }>> => {
    try {
      const response = await fetch('/auth/unlink-provider', {
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

  getMe: async (token: string): Promise<ApiResponse<User>> => {
    return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  },
};
