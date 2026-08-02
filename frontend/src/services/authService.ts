/**
 * authService.ts
 * --------------
 * Thin service layer between AuthContext and authApi.
 * Real authentication is handled by the FastAPI backend.
 * localStorage is used only to persist the JWT session between page refreshes.
 */

import { User, UserRole, RegisterCustomerDTO, AuthSession, SocialProvider } from '../types/auth';
import { STORAGE_KEYS, getItem, setItem, removeItem } from '../utils/storage';
import { authApi } from './api/authApi';

// Kept for backwards compatibility with teammate code that imports StoredUser
export type StoredUser = User & { passwordHash?: string };

export const authService = {

  // -------------------------------------------------------------------------
  // Register — POST /auth/register
  // -------------------------------------------------------------------------
  registerCustomer: async (dto: RegisterCustomerDTO): Promise<{ email: string }> => {
    const response = await authApi.register(dto);
    if (!response.success) {
      throw new Error(response.error || response.message || 'Registration failed.');
    }
    return { email: dto.email.trim().toLowerCase() };
  },

  // -------------------------------------------------------------------------
  // Verify OTP — POST /auth/verify-otp
  // -------------------------------------------------------------------------
  verifyOTP: async (
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await authApi.verifyOtp({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
    if (!response.success) {
      throw new Error(response.error || response.message || 'Verification failed.');
    }
    return { success: true, message: response.message };
  },

  // -------------------------------------------------------------------------
  // Resend OTP — POST /auth/resend-otp
  // -------------------------------------------------------------------------
  resendOTP: async (
    email: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await authApi.resendOtp({ email: email.trim().toLowerCase() });
    if (!response.success) {
      throw new Error(response.error || response.message || 'Failed to resend code.');
    }
    return { success: true, message: response.message };
  },

  // -------------------------------------------------------------------------
  // Login — POST /auth/login
  // -------------------------------------------------------------------------
  login: async (
    email: string,
    password: string,
    _role: UserRole,
  ): Promise<AuthSession> => {
    const response = await authApi.login({
      email: email.trim().toLowerCase(),
      password,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Login failed.');
    }
    const { access_token, user } = response.data as any;
    const session: AuthSession = { user: user as User, token: access_token };
    setItem(STORAGE_KEYS.AUTH, session);
    return session;
  },

  // -------------------------------------------------------------------------
  // Social (OAuth) login — redirects browser to the provider URL.
  // The backend handles the OAuth flow and redirects back to /auth/callback
  // with a JWT. Until the backend OAuth endpoints are live this falls back to
  // a demo session so the teammate's SocialAuthButtons UI still renders.
  // -------------------------------------------------------------------------
  socialLogin: async (provider: SocialProvider): Promise<AuthSession> => {
    const url = authApi.getOAuthLoginUrl(provider);
    // When the backend OAuth is ready, uncomment the line below to do a full
    // browser redirect instead of the demo fallback:
    // window.location.href = url;

    // Demo fallback — creates a placeholder session so the UI doesn't break
    const demoUser: User = {
      id: `oauth-${provider.toLowerCase()}-${Date.now()}`,
      fullName: `${provider} User`,
      firstName: provider,
      lastName: 'User',
      email: `${provider.toLowerCase()}.demo@billingplatform.com`,
      role: 'Customer',
      createdAt: new Date().toISOString(),
      status: 'Verified',
    };
    const session: AuthSession = {
      user: demoUser,
      token: `demo-oauth-${provider.toLowerCase()}-${Date.now()}`,
    };
    setItem(STORAGE_KEYS.AUTH, session);
    return session;
  },

  // -------------------------------------------------------------------------
  // Link / Unlink OAuth provider — stubs until backend endpoints are live
  // -------------------------------------------------------------------------
  linkProvider: async (email: string, provider: SocialProvider) => {
    await authApi.linkProvider({ email, provider });
  },

  unlinkProvider: async (email: string, provider: SocialProvider) => {
    await authApi.unlinkProvider({ email, provider });
  },

  // -------------------------------------------------------------------------
  // Get current session from localStorage (used on page refresh)
  // -------------------------------------------------------------------------
  getCurrentSession: (): AuthSession | null => {
    return getItem<AuthSession | null>(STORAGE_KEYS.AUTH, null);
  },

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  logout: (): void => {
    authApi.logout().catch(() => {});
    removeItem(STORAGE_KEYS.AUTH);
  },

  // -------------------------------------------------------------------------
  // Forgot password — POST /auth/forgot-password
  // -------------------------------------------------------------------------
  forgotPassword: async (email: string) => {
    return await authApi.forgotPassword({ email: email.trim().toLowerCase() });
  },

  // -------------------------------------------------------------------------
  // Reset password — POST /auth/reset-password
  // -------------------------------------------------------------------------
  resetPassword: async (token: string, newPassword: string) => {
    return await authApi.resetPassword({ token, newPassword });
  },

  // -------------------------------------------------------------------------
  // Rehydrate user from backend JWT on app startup
  // -------------------------------------------------------------------------
  fetchCurrentUser: async (): Promise<User | null> => {
    try {
      const user = await authApi.getMe();
      return user as User;
    } catch {
      return null;
    }
  },
};
