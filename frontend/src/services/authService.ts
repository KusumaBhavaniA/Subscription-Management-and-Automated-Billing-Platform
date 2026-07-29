import { User, UserRole, RegisterCustomerDTO, AuthSession } from '../types/auth';
import { Customer } from '../types/customer';
import { STORAGE_KEYS, getItem, setItem, removeItem } from '../utils/storage';
import { authApi } from './api/authApi';

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
      passwordHash: dto.password,
      createdAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, filteredPending);

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

    if (pending) {
      const customerId = `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newUser: StoredUser = {
        id: `usr-cust-${Date.now()}`,
        customerId,
        fullName: pending.fullName,
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        phoneNumber: pending.phoneNumber,
        country: 'India',
        role: 'Customer',
        createdAt: new Date().toISOString(),
        registrationDate: new Date().toLocaleDateString('en-GB'),
        status: 'Verified',
        currentPlan: 'Starter',
        subscriptionStatus: 'Active',
        passwordHash: pending.passwordHash,
        themePreference: 'light',
      };

      const existingUsers = getItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
      existingUsers.push(newUser);
      setItem(STORAGE_KEYS.USERS, existingUsers);

      const existingCustomers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
      existingCustomers.push({
        id: newUser.id,
        customerId,
        name: newUser.fullName,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phoneNumber || '',
        status: 'Verified',
        subscriptionPlan: 'Starter',
        mrr: 0,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        registrationDate: newUser.registrationDate || '',
        country: 'India',
        themePreference: 'light',
      });
      setItem(STORAGE_KEYS.CUSTOMERS, existingCustomers);

      // Remove from pending
      setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, pendingList.filter((p) => p.email?.toLowerCase() !== cleanEmail));
    }

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
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName?.trim();

    // Call FastAPI Backend Placeholder API
    await authApi.login({
      fullName: role === 'Customer' ? cleanFullName : undefined,
      email: cleanEmail,
      password,
    });

    // Admin login demo fallback
    if (role === 'Admin') {
      if (cleanEmail === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.passwordHash) {
        const { passwordHash, ...adminUser } = HARDCODED_ADMIN;
        const session: AuthSession = {
          user: adminUser,
          token: `prod-jwt-token-admin-${Date.now()}`,
        };
        setItem(STORAGE_KEYS.AUTH, session);
        return session;
      }
      throw new Error('Invalid email or password.');
    }

    // Customer login check
    const storedUsers = getItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const foundUser = storedUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.role === 'Customer'
    );

    if (foundUser && foundUser.passwordHash === password) {
      const { passwordHash, ...customerUser } = foundUser;
      if (cleanFullName) customerUser.fullName = cleanFullName;
      const session: AuthSession = {
        user: customerUser,
        token: `prod-jwt-token-customer-${Date.now()}`,
      };
      setItem(STORAGE_KEYS.AUTH, session);
      return session;
    }

    // Generic customer fallback for demo preview
    if (role === 'Customer' && cleanEmail && password) {
      const displayFullName = cleanFullName || cleanEmail.split('@')[0].replace('.', ' ').toUpperCase();
      const customerUser: User = {
        id: `usr-cust-${Date.now()}`,
        customerId: `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: displayFullName,
        firstName: displayFullName.split(' ')[0],
        lastName: displayFullName.split(' ').slice(1).join(' ') || 'User',
        email: cleanEmail,
        role: 'Customer',
        createdAt: new Date().toISOString(),
        status: 'Verified',
        currentPlan: 'Starter',
      };
      const session: AuthSession = {
        user: customerUser,
        token: `prod-jwt-token-customer-${Date.now()}`,
      };
      setItem(STORAGE_KEYS.AUTH, session);
      return session;
    }

    throw new Error('Invalid email or password.');
  },

  getCurrentSession: (): AuthSession | null => {
    return getItem<AuthSession | null>(STORAGE_KEYS.AUTH, null);
  },

  logout: (): void => {
    authApi.logout().catch(() => {});
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
};

