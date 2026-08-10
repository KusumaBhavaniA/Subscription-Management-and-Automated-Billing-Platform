import { User, UserRole, RegisterCustomerDTO, AuthSession } from '../types/auth';
import { Customer } from '../types/customer';
import { STORAGE_KEYS, getItem, setItem, removeItem } from '../utils/storage';
import { authApi } from './api/authApi';
import { ENABLED_OAUTH_PROVIDERS } from '../config/authConfig';

/**
 * HARDCODED DEMO ADMIN CREDENTIALS FOR DASHBOARD PREVIEW
 */
const HARDCODED_ADMIN: User & { passwordHash: string } = {
  id: 'usr-admin-001',
  customerId: 'ADM-2026-000001',
  fullName: 'System Administrator',
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@billingplatform.com',
  passwordHash: 'Admin@123',
  role: 'Admin',
  createdAt: new Date().toISOString(),
  status: 'Verified',
};

export interface StoredUser extends User {
  passwordHash: string;
}

export const authService = {
  /**
   * CUSTOMER REGISTRATION API PLACEHOLDER
   * Calls POST /api/auth/register
   * Backend handles user creation, OTP generation, and email sending.
   */
  registerCustomer: async (dto: RegisterCustomerDTO): Promise<{ email: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanEmail = dto.email.trim().toLowerCase();

    if (cleanEmail === HARDCODED_ADMIN.email) {
      throw new Error('This email is reserved for system administration.');
    }

    // Call FastAPI Backend Placeholder API
    const response = await authApi.register(dto);
    if (!response.success) {
      throw new Error(response.error || response.message || 'Registration failed.');
    }

    // Store minimal pending state locally for seamless flow transition if needed
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const fullName = `${firstName} ${lastName}`;

    const pendingList = getItem<any[]>(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
    const filteredPending = pendingList.filter((p) => p.email?.toLowerCase() !== cleanEmail);
    filteredPending.push({
      email: cleanEmail,
      firstName,
      lastName,
      fullName,
      phoneNumber: `${dto.phoneCode || '+91'} ${dto.phoneNumber.trim()}`,
      country: dto.country || 'India',
      passwordHash: dto.password,
      createdAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, filteredPending);

    // STEP 4: Add to Admin -> Customers directory immediately as Pending Verification
    const customerId = `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const existingCustomers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const customerIndex = existingCustomers.findIndex(c => c.email.toLowerCase() === cleanEmail);
    
    const newPendingCustomer: Customer = {
      id: `cust-${Date.now()}`,
      customerId,
      name: fullName,
      firstName,
      lastName,
      email: cleanEmail,
      phone: `${dto.phoneCode || '+91'} ${dto.phoneNumber.trim()}`,
      status: 'Pending Verification',
      subscriptionPlan: 'None',
      subscriptionStatus: 'Inactive',
      mrr: 0,
      totalSpent: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      registrationDate: new Date().toLocaleDateString('en-GB'),
      country: dto.country || 'India',
      themePreference: 'light',
    };

    if (customerIndex >= 0) {
      existingCustomers[customerIndex] = newPendingCustomer;
    } else {
      existingCustomers.unshift(newPendingCustomer);
    }
    setItem(STORAGE_KEYS.CUSTOMERS, existingCustomers);

    return { email: cleanEmail };
  },

  /**
   * OTP VERIFICATION API PLACEHOLDER
   * Calls POST /api/auth/verify-otp
   * Backend verifies OTP, activates user account, and sends Welcome email.
   */
  verifyOTP: async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    // Call FastAPI Backend Placeholder API
    const response = await authApi.verifyOtp({ email: cleanEmail, otp: cleanOtp });
    if (!response.success) {
      throw new Error(response.error || 'Verification failed. Please check the code and try again.');
    }

    // Provision user into demo state if pending registration exists
    const pendingList = getItem<any[]>(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
    const pending = pendingList.find((p) => p.email?.toLowerCase() === cleanEmail);

    const existingCustomers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const existingCust = existingCustomers.find(c => c.email.toLowerCase() === cleanEmail);

    const customerId = existingCust?.customerId || `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newUser: StoredUser = {
      id: existingCust?.id || `usr-cust-${Date.now()}`,
      customerId,
      fullName: pending?.fullName || existingCust?.name || cleanEmail,
      firstName: pending?.firstName || existingCust?.firstName || cleanEmail.split('@')[0],
      lastName: pending?.lastName || existingCust?.lastName || '',
      email: cleanEmail,
      phoneNumber: pending?.phoneNumber || existingCust?.phone || '',
      country: pending?.country || existingCust?.country || 'India',
      role: 'Customer',
      createdAt: new Date().toISOString(),
      registrationDate: new Date().toLocaleDateString('en-GB'),
      status: 'Verified',
      currentPlan: existingCust?.subscriptionPlan || 'None',
      subscriptionStatus: existingCust?.subscriptionStatus || 'Inactive',
      passwordHash: pending?.passwordHash || '',
      themePreference: 'light',
    };

    const existingUsers = getItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const userIdx = existingUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (userIdx >= 0) {
      existingUsers[userIdx] = newUser;
    } else {
      existingUsers.push(newUser);
    }
    setItem(STORAGE_KEYS.USERS, existingUsers);

    // STEP 4: Update status to 'Verified' upon email verification. Subscription remains inactive.
    if (existingCust) {
      existingCust.status = 'Verified';
      setItem(STORAGE_KEYS.CUSTOMERS, existingCustomers);
    } else {
      existingCustomers.unshift({
        id: newUser.id,
        customerId,
        name: newUser.fullName,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phoneNumber || '',
        status: 'Verified',
        subscriptionPlan: 'None',
        subscriptionStatus: 'Inactive',
        mrr: 0,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        registrationDate: newUser.registrationDate || '',
        country: newUser.country || 'India',
        themePreference: 'light',
      });
      setItem(STORAGE_KEYS.CUSTOMERS, existingCustomers);
    }

    // Remove from pending
    setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, pendingList.filter((p) => p.email?.toLowerCase() !== cleanEmail));

    return {
      success: true,
      message: 'Your account has been verified successfully.',
    };
  },

  /**
   * RESEND OTP API PLACEHOLDER
   * Calls POST /api/auth/resend-otp
   * Backend generates new OTP and sends verification email.
   */
  resendOTP: async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanEmail = email.trim().toLowerCase();

    // Call FastAPI Backend Placeholder API
    const response = await authApi.resendOtp({ email: cleanEmail });
    if (!response.success) {
      throw new Error(response.error || 'Failed to resend verification code.');
    }

    return {
      success: true,
      message: 'A new verification code has been sent to your email address.',
    };
  },

  /**
   * USER LOGIN API PLACEHOLDER
   * Calls POST /api/auth/login
   */
  login: async (email: string, password: string, role: UserRole, fullName?: string): Promise<AuthSession> => {
    const cleanEmail = email.trim().toLowerCase();

    const apiResponse = await authApi.login({
      email: cleanEmail,
      password,
    });

    if (apiResponse.success && apiResponse.data?.token && apiResponse.data?.user) {
      const session: AuthSession = {
        user: apiResponse.data.user,
        token: apiResponse.data.token,
      };
      setItem(STORAGE_KEYS.AUTH, session);
      return session;
    }

    throw new Error(apiResponse.error || apiResponse.message || 'Login failed.');
  },

  getCurrentSession: (): AuthSession | null => {
    return getItem<AuthSession | null>(STORAGE_KEYS.AUTH, null);
  },

  logout: (): void => {
    const session = getItem<AuthSession | null>(STORAGE_KEYS.AUTH, null);
    authApi.logout(session?.token).catch(() => {});
    removeItem(STORAGE_KEYS.AUTH);
  },

  /**
   * FORGOT PASSWORD API PLACEHOLDER
   * Calls POST /api/auth/forgot-password
   */
  forgotPassword: async (email: string) => {
    return await authApi.forgotPassword({ email });
  },

  /**
   * RESET PASSWORD API PLACEHOLDER
   * Calls POST /api/auth/reset-password
   */
  resetPassword: async (token: string, newPassword: string) => {
    return await authApi.resetPassword({ token, newPassword });
  },

  /**
   * SOCIAL LOGIN & OAUTH 2.0 INTEGRATION
   */
  socialLogin: async (provider: 'Google' | 'Microsoft' | 'Apple'): Promise<AuthSession> => {
    if (!ENABLED_OAUTH_PROVIDERS[provider]) {
      throw new Error(`Authentication with ${provider} is coming soon.`);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (provider === 'Google') await authApi.googleLogin({});
    else if (provider === 'Microsoft') await authApi.microsoftLogin({});
    else if (provider === 'Apple') await authApi.appleLogin({});

    const profiles: Record<'Google' | 'Microsoft' | 'Apple', { fullName: string; email: string; avatar: string }> = {
      Google: {
        fullName: 'Rohan Sharma',
        email: 'rohan.sharma@techcorp.in',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      Microsoft: {
        fullName: 'Alex Morgan',
        email: 'alex.morgan@microsoft.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
      Apple: {
        fullName: 'Priya Sundaram',
        email: 'priya@datasolutions.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      },
    };

    const targetProfile = profiles[provider];
    const cleanEmail = targetProfile.email.toLowerCase();

    const users = getItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const existingUserIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    let sessionUser: User;

    if (existingUserIndex !== -1) {
      const existingUser = users[existingUserIndex];
      const linked = new Set(existingUser.linkedProviders || []);
      linked.add(provider);

      existingUser.fullName = targetProfile.fullName;
      existingUser.profilePicture = targetProfile.avatar;
      existingUser.linkedProviders = Array.from(linked);
      existingUser.lastLoginTime = new Date().toISOString();

      users[existingUserIndex] = existingUser;
      setItem(STORAGE_KEYS.USERS, users);

      const { passwordHash, ...safeUser } = existingUser;
      sessionUser = safeUser;
    } else {
      const customerId = `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newUser: StoredUser = {
        id: `usr-cust-${Date.now()}`,
        customerId,
        fullName: targetProfile.fullName,
        firstName: targetProfile.fullName.split(' ')[0],
        lastName: targetProfile.fullName.split(' ').slice(1).join(' ') || 'User',
        email: cleanEmail,
        role: 'Customer',
        createdAt: new Date().toISOString(),
        registrationDate: new Date().toLocaleDateString('en-GB'),
        status: 'Verified',
        currentPlan: 'None',
        subscriptionStatus: 'Inactive',
        passwordHash: '',
        authProvider: provider,
        linkedProviders: [provider],
        profilePicture: targetProfile.avatar,
        lastLoginTime: new Date().toISOString(),
      };

      users.push(newUser);
      setItem(STORAGE_KEYS.USERS, users);

      const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
      if (!customers.some((c) => c.email.toLowerCase() === cleanEmail)) {
        customers.unshift({
          id: newUser.id,
          customerId,
          name: targetProfile.fullName,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: cleanEmail,
          phone: '',
          status: 'Verified',
          subscriptionPlan: 'None',
          subscriptionStatus: 'Inactive',
          mrr: 0,
          totalSpent: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          country: 'India',
        });
        setItem(STORAGE_KEYS.CUSTOMERS, customers);
      }

      const { passwordHash, ...safeUser } = newUser;
      sessionUser = safeUser;
    }

    const session: AuthSession = {
      user: sessionUser,
      token: `prod-oauth-jwt-${provider.toLowerCase()}-${Date.now()}`,
    };

    setItem(STORAGE_KEYS.AUTH, session);
    return session;
  },

  linkProvider: async (email: string, provider: 'Google' | 'Microsoft' | 'Apple') => {
    await authApi.linkProvider({ email, provider });
    const users = getItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      const linked = new Set(users[idx].linkedProviders || []);
      linked.add(provider);
      users[idx].linkedProviders = Array.from(linked);
      setItem(STORAGE_KEYS.USERS, users);
    }
  },

  unlinkProvider: async (email: string, provider: 'Google' | 'Microsoft' | 'Apple') => {
    await authApi.unlinkProvider({ email, provider });
    const users = getItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1 && users[idx].linkedProviders) {
      users[idx].linkedProviders = users[idx].linkedProviders!.filter((p) => p !== provider);
      setItem(STORAGE_KEYS.USERS, users);
    }
  },

  isProfileIncomplete: (user: User | null): boolean => {
    if (!user || user.role !== 'Customer') return false;
    const phone = user.phoneNumber || (user as any).phone || '';
    return !phone || !phone.trim();
  },

  checkProfileCompleteness: async (user: User) => {
    if (!user || user.role !== 'Customer') return;

    const phone = user.phoneNumber || (user as any).phone || '';
    const missingFields: string[] = [];
    if (!user.fullName || !user.fullName.trim()) missingFields.push('Full Name');
    if (!user.email || !user.email.trim()) missingFields.push('Email Address');
    if (!phone || !phone.trim()) missingFields.push('Mobile Number');

    if (missingFields.length > 0) {
      const existingNotifs = getItem<any[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const alreadyHasNotif = existingNotifs.some(
        (n) => (n.title === 'Complete Your Profile' || n.title === 'Profile Incomplete') && !n.isRead
      );

      if (!alreadyHasNotif) {
        const notifItem = {
          id: `notif-${Date.now()}`,
          title: 'Complete Your Profile',
          message: 'Your profile information is incomplete. Please update your details.',
          timestamp: 'Just now',
          isRead: false,
          type: 'warning',
          actionLabel: 'Complete Profile',
          actionUrl: '/customer/profile',
        };
        existingNotifs.unshift(notifItem);
        setItem(STORAGE_KEYS.NOTIFICATIONS, existingNotifs);
      }

      try {
        await authApi.notifyProfileIncomplete({
          email: user.email,
          fullName: user.fullName,
          missingFields,
        });
      } catch (e) {
        // Safe fallback
      }
    } else {
      // Profile is complete -> remove any profile incomplete notification
      const existingNotifs = getItem<any[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const filtered = existingNotifs.filter(
        (n) => n.title !== 'Complete Your Profile' && n.title !== 'Profile Incomplete'
      );
      if (filtered.length !== existingNotifs.length) {
        setItem(STORAGE_KEYS.NOTIFICATIONS, filtered);
      }
    }
  },
};

