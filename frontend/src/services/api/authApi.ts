/**
 * authApi.ts
 * ----------
 * Direct HTTP calls to the FastAPI authentication endpoints.
 * All methods use the shared apiClient (axios instance) which:
 *   - points to http://localhost:8000
 *   - automatically attaches the stored JWT as Bearer token
 *   - redirects to /login on 401
 */

import { apiClient } from './apiClient';
import { RegisterCustomerDTO, OTPVerificationDTO, AuthSession, SocialProvider } from '../../types/auth';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Normalise axios errors into a plain Error with a readable message
function extractError(err: any): never {
  const detail = err?.response?.data?.detail;
  if (detail) throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  const message = err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
  throw new Error(message);
}

export const authApi = {

  // -------------------------------------------------------------------------
  // OAuth redirect URLs — used by SocialAuthButtons to kick off OAuth flow
  // -------------------------------------------------------------------------
  getOAuthLoginUrl: (provider: SocialProvider): string => {
    switch (provider) {
      case 'Google':    return 'http://localhost:8000/auth/google/login';
      case 'Microsoft': return 'http://localhost:8000/auth/microsoft/login';
      case 'Apple':     return 'http://localhost:8000/auth/apple/login';
    }
  },

  // -------------------------------------------------------------------------
  // POST /auth/register
  // -------------------------------------------------------------------------
  register: async (
    payload: RegisterCustomerDTO,
  ): Promise<ApiResponse<{ email: string }>> => {
    try {
      const { data } = await apiClient.post('/auth/register', {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        country: payload.country ?? 'India',
        phoneCode: payload.phoneCode ?? '+91',
        acceptTerms: payload.acceptTerms,
      });
      return data;
    } catch (err) {
      extractError(err);
    }
  },

  // -------------------------------------------------------------------------
  // POST /auth/verify-otp
  // -------------------------------------------------------------------------
  verifyOtp: async (
    payload: OTPVerificationDTO,
  ): Promise<ApiResponse<{ verified: boolean }>> => {
    try {
      const { data } = await apiClient.post('/auth/verify-otp', {
        email: payload.email,
        otp: payload.otp,
      });
      return data;
    } catch (err) {
      extractError(err);
    }
  },

  // -------------------------------------------------------------------------
  // POST /auth/resend-otp
  // -------------------------------------------------------------------------
  resendOtp: async (
    payload: { email: string },
  ): Promise<ApiResponse<{ otpSent: boolean }>> => {
    try {
      const { data } = await apiClient.post('/auth/resend-otp', {
        email: payload.email,
      });
      return data;
    } catch (err) {
      extractError(err);
    }
  },

  // -------------------------------------------------------------------------
  // POST /auth/login
  // -------------------------------------------------------------------------
  login: async (payload: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthSession & { access_token: string; token_type: string }>> => {
    try {
      const { data } = await apiClient.post('/auth/login', {
        email: payload.email,
        password: payload.password,
      });
      return data;
    } catch (err) {
      extractError(err);
    }
  },

  // -------------------------------------------------------------------------
  // GET /auth/me
  // -------------------------------------------------------------------------
  getMe: async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      return data;
    } catch (err) {
      extractError(err);
    }
  },

  // -------------------------------------------------------------------------
  // POST /auth/forgot-password
  // -------------------------------------------------------------------------
  forgotPassword: async (
    payload: { email: string },
  ): Promise<ApiResponse<{ emailSent: boolean }>> => {
    try {
      const { data } = await apiClient.post('/auth/forgot-password', {
        email: payload.email,
      });
      return data;
    } catch (err) {
      extractError(err);
    }
  },

  // -------------------------------------------------------------------------
  // POST /auth/reset-password
  // -------------------------------------------------------------------------
  resetPassword: async (payload: {
    token: string;
    newPassword: string;
  }): Promise<ApiResponse<{ reset: boolean }>> => {
    try {
      const { data } = await apiClient.post('/auth/reset-password', {
        token: payload.token,
        newPassword: payload.newPassword,
      });
      return data;
    } catch (err) {
      extractError(err);
    }
  },

  // -------------------------------------------------------------------------
  // POST /auth/logout
  // -------------------------------------------------------------------------
  logout: async (): Promise<ApiResponse<{ loggedOut: boolean }>> => {
    try {
      const { data } = await apiClient.post('/auth/logout');
      return data;
    } catch {
      return { success: true, message: 'Logged out.', data: { loggedOut: true } };
    }
  },

  // -------------------------------------------------------------------------
  // Provider link/unlink — stubs until backend OAuth endpoints are ready
  // -------------------------------------------------------------------------
  linkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ linked: boolean }>> => {
    return { success: true, message: `${payload.provider} connected.`, data: { linked: true } };
  },

  unlinkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ unlinked: boolean }>> => {
    return { success: true, message: `${payload.provider} disconnected.`, data: { unlinked: true } };
  },
};
