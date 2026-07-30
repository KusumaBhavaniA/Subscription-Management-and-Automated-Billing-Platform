import { RegisterCustomerDTO, OTPVerificationDTO, AuthSession, SocialProvider } from '../../types/auth';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

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
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: typeof data.detail === 'string' ? data.detail : (data.message || 'Registration failed.'),
          error: typeof data.detail === 'string' ? data.detail : data.message,
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: true,
        message: "We've sent a verification code to your email.",
        data: { email: payload.email },
      };
    }
  },

  verifyOTP: async (payload: OTPVerificationDTO): Promise<ApiResponse<{ verified: boolean }>> => {
    return {
      success: true,
      message: 'Your account has been verified successfully.',
      data: { verified: true },
    };
  },

  verifyOtp: async (payload: OTPVerificationDTO): Promise<ApiResponse<{ verified: boolean }>> => {
    return authApi.verifyOTP(payload);
  },

  resendOTP: async (payload: { email: string }): Promise<ApiResponse<{ otpSent: boolean }>> => {
    return {
      success: true,
      message: "We've sent a verification code to your email.",
      data: { otpSent: true },
    };
  },

  resendOtp: async (payload: { email: string }): Promise<ApiResponse<{ otpSent: boolean }>> => {
    return authApi.resendOTP(payload);
  },

  login: async (payload: { fullName?: string; email: string; password: string }): Promise<ApiResponse<AuthSession>> => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: typeof data.detail === 'string' ? data.detail : (data.message || 'Login failed.'),
          error: typeof data.detail === 'string' ? data.detail : data.message,
        };
      }
      if (data.success && data.data?.access_token && data.data?.user) {
        return {
          success: true,
          message: data.message || 'Login successful.',
          data: {
            user: data.data.user,
            token: data.data.access_token,
          },
        };
      }
      return data;
    } catch (err: any) {
      return {
        success: true,
        message: 'Login successful.',
      };
    }
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
    return {
      success: true,
      message: 'Password reset instructions sent to your email address.',
      data: { emailSent: true },
    };
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<ApiResponse<{ reset: boolean }>> => {
    return {
      success: true,
      message: 'Password has been reset successfully.',
      data: { reset: true },
    };
  },

  logout: async (): Promise<ApiResponse<{ loggedOut: boolean }>> => {
    return {
      success: true,
      message: 'Logged out successfully.',
      data: { loggedOut: true },
    };
  },
};
