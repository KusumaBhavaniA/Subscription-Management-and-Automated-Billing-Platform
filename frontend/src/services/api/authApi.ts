import { RegisterCustomerDTO, OTPVerificationDTO, AuthSession, SocialProvider, User } from '../../types/auth';
import { ENABLED_OAUTH_PROVIDERS } from '../../config/authConfig';
import { STORAGE_KEYS, getItem } from '../../utils/storage';

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
    if (!ENABLED_OAUTH_PROVIDERS[provider]) {
      console.warn(`OAuth provider ${provider} is disabled (Coming Soon).`);
      return '#';
    }
    return '#';
  },

  register: async (payload: RegisterCustomerDTO): Promise<ApiResponse<{ email: string }>> => {
    return {
      success: true,
      message: 'Verification code sent to your email address.',
      data: { email: payload.email.toLowerCase().trim() },
    };
  },

  verifyOTP: async (payload: OTPVerificationDTO): Promise<ApiResponse<{ verified: boolean }>> => {
    return {
      success: true,
      message: 'Account verified successfully.',
      data: { verified: true },
    };
  },

  verifyOtp: async (payload: OTPVerificationDTO): Promise<ApiResponse<{ verified: boolean }>> => {
    return authApi.verifyOTP(payload);
  },

  resendOTP: async (payload: { email: string }): Promise<ApiResponse<{ otpSent: boolean }>> => {
    return {
      success: true,
      message: 'A new verification code has been sent.',
      data: { otpSent: true },
    };
  },

  resendOtp: async (payload: { email: string }): Promise<ApiResponse<{ otpSent: boolean }>> => {
    return authApi.resendOTP(payload);
  },

  login: async (payload: { fullName?: string; email: string; password: string }): Promise<ApiResponse<AuthSession>> => {
    const cleanEmail = payload.email.trim().toLowerCase();

    // Check hardcoded admin
    if (cleanEmail === 'admin@billingplatform.com') {
      const adminUser: User = {
        id: 'usr-admin-001',
        customerId: 'ADM-2026-000001',
        fullName: 'System Administrator',
        firstName: 'System',
        lastName: 'Administrator',
        email: cleanEmail,
        role: 'Admin',
        createdAt: new Date().toISOString(),
        status: 'Verified',
        accountStatus: 'ACTIVE',
      };
      return {
        success: true,
        message: 'Admin authenticated successfully.',
        data: {
          token: `mock-admin-token-${Date.now()}`,
          user: adminUser,
        },
      };
    }

    // Check localStorage users
    const users = getItem<any[]>(STORAGE_KEYS.USERS, []);
    const localUser = users.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (localUser) {
      const { passwordHash, ...userObj } = localUser;
      return {
        success: true,
        message: 'Authenticated successfully.',
        data: {
          token: `mock-user-token-${Date.now()}`,
          user: userObj,
        },
      };
    }

    // Check localStorage customers
    const customers = getItem<any[]>(STORAGE_KEYS.CUSTOMERS, []);
    const localCust = customers.find((c) => c.email?.toLowerCase() === cleanEmail);

    if (localCust) {
      const custUser: User = {
        id: localCust.id || `usr-cust-${Date.now()}`,
        customerId: localCust.customerId || 'CUS-2026-000001',
        fullName: localCust.name,
        firstName: localCust.firstName || localCust.name.split(' ')[0],
        lastName: localCust.lastName || localCust.name.split(' ').slice(1).join(' '),
        email: cleanEmail,
        phoneNumber: localCust.phone || '',
        country: localCust.country || 'India',
        role: 'Customer',
        createdAt: localCust.joinedDate || new Date().toISOString(),
        status: localCust.status || 'Verified',
        accountStatus: localCust.accountStatus || (localCust.status === 'Suspended' ? 'SUSPENDED' : 'ACTIVE'),
        currentPlan: localCust.subscriptionPlan || 'Starter',
        subscriptionStatus: localCust.subscriptionStatus || 'Active',
      };

      return {
        success: true,
        message: 'Authenticated successfully.',
        data: {
          token: `mock-user-token-${Date.now()}`,
          user: custUser,
        },
      };
    }

    // Default fallback user if no matching user found
    const defaultUser: User = {
      id: `usr-cust-${Date.now()}`,
      customerId: `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: payload.fullName || cleanEmail.split('@')[0],
      firstName: cleanEmail.split('@')[0],
      lastName: '',
      email: cleanEmail,
      role: 'Customer',
      createdAt: new Date().toISOString(),
      status: 'Verified',
      accountStatus: 'ACTIVE',
      currentPlan: 'Starter',
      subscriptionStatus: 'Active',
    };

    return {
      success: true,
      message: 'Authenticated successfully.',
      data: {
        token: `mock-user-token-${Date.now()}`,
        user: defaultUser,
      },
    };
  },

  googleLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Google' }>> => {
    return {
      success: true,
      message: 'Authenticated with Google successfully.',
      data: { provider: 'Google' },
    };
  },

  microsoftLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Microsoft' }>> => {
    return {
      success: true,
      message: 'Authenticated with Microsoft successfully.',
      data: { provider: 'Microsoft' },
    };
  },

  appleLogin: async (payload: { token?: string }): Promise<ApiResponse<{ provider: 'Apple' }>> => {
    return {
      success: true,
      message: 'Authenticated with Apple successfully.',
      data: { provider: 'Apple' },
    };
  },

  linkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ linked: boolean }>> => {
    return {
      success: true,
      message: `${payload.provider} connected successfully.`,
      data: { linked: true },
    };
  },

  unlinkProvider: async (payload: { email: string; provider: SocialProvider }): Promise<ApiResponse<{ unlinked: boolean }>> => {
    return {
      success: true,
      message: `${payload.provider} disconnected successfully.`,
      data: { unlinked: true },
    };
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
      message: 'Your password has been reset successfully.',
      data: { reset: true },
    };
  },

  logout: async (token?: string): Promise<ApiResponse<{ loggedOut: boolean }>> => {
    return {
      success: true,
      message: 'Logged out successfully.',
      data: { loggedOut: true },
    };
  },

  notifyProfileIncomplete: async (payload: { email: string; fullName: string; missingFields: string[] }): Promise<ApiResponse<{ emailSent: boolean }>> => {
    return {
      success: true,
      message: 'Profile incomplete notification created locally.',
      data: { emailSent: true },
    };
  },

  getMe: async (token: string): Promise<ApiResponse<User>> => {
    const currentSession = getItem<any>(STORAGE_KEYS.AUTH, null);
    if (currentSession && currentSession.user) {
      return {
        success: true,
        message: 'Current session user fetched.',
        data: currentSession.user,
      };
    }
    return {
      success: false,
      message: 'No active session',
    };
  },
};
