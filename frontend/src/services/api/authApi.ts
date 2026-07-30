import { RegisterCustomerDTO, OTPVerificationDTO, AuthSession } from '../../types/auth';

/**
 * FASTAPI BACKEND AUTHENTICATION API PLACEHOLDERS
 * 
 * Production FastAPI Endpoints Contract:
 * - POST /api/auth/register
 * - POST /api/auth/verify-otp
 * - POST /api/auth/resend-otp
 * - POST /api/auth/login
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 * - POST /api/auth/logout
 * 
 * Frontend provides the UI and placeholder API hooks.
 * OTP generation, Email Sending (Verification & Welcome), Password Reset logic,
 * and Subscription Logic are implemented by the FastAPI backend team.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const authApi = {
  /**
   * Endpoint: POST /api/auth/register
   * Backend will validate registration data, generate OTP, and send verification email.
   */
  register: async (payload: RegisterCustomerDTO): Promise<ApiResponse<{ email: string }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: "We've sent a verification code to your email address. Please check your inbox.",
      data: { email: payload.email },
    };
  },

  /**
   * Endpoint: POST /api/auth/verify-otp
   * Backend will verify OTP, activate user account, and send Welcome email.
   */
  verifyOtp: async (payload: OTPVerificationDTO): Promise<ApiResponse<{ verified: boolean }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/auth/verify-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: 'Your account has been verified successfully.',
      data: { verified: true },
    };
  },

  /**
   * Endpoint: POST /api/auth/resend-otp
   * Backend will generate new OTP and resend verification email.
   */
  resendOtp: async (payload: { email: string }): Promise<ApiResponse<{ otpSent: boolean }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/auth/resend-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: 'A new verification code has been sent to your email address.',
      data: { otpSent: true },
    };
  },

  /**
   * Endpoint: POST /api/auth/login
   * Backend handles authentication and returns session JWT token.
   */
  login: async (payload: { fullName?: string; email: string; password: string }): Promise<ApiResponse<AuthSession>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: 'Login successful.',
    };
  },

  /**
   * Endpoint: POST /api/auth/forgot-password
   * Backend receives email address and sends password reset instructions email.
   */
  forgotPassword: async (payload: { email: string }): Promise<ApiResponse<{ emailSent: boolean }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/auth/forgot-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: 'Password reset instructions sent to your email.',
      data: { emailSent: true },
    };
  },

  /**
   * Endpoint: POST /api/auth/reset-password
   * Backend validates reset token and updates user password in PostgreSQL.
   */
  resetPassword: async (payload: { token: string; newPassword: string }): Promise<ApiResponse<{ reset: boolean }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/auth/reset-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: 'Password has been reset successfully.',
      data: { reset: true },
    };
  },

  /**
   * Endpoint: POST /api/auth/logout
   * Backend invalidates JWT token or clears session cookie.
   */
  logout: async (): Promise<ApiResponse<{ loggedOut: boolean }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/auth/logout', { method: 'POST' });
    // return await response.json();

    return {
      success: true,
      message: 'Logged out successfully.',
      data: { loggedOut: true },
    };
  },
};
