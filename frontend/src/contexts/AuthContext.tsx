import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, RegisterCustomerDTO, AuthSession, SocialProvider } from '../types/auth';
import { authService } from '../services/authService';
import { STORAGE_KEYS, getItem, setItem } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole, fullName?: string) => Promise<AuthSession>;
  socialLogin: (provider: SocialProvider) => Promise<AuthSession>;
  acceptSession: (session: AuthSession) => void;
  logout: () => void;
  register: (dto: RegisterCustomerDTO) => Promise<{ email: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  updateUser: (updatedUser: Partial<User>) => void;
  getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const syncUser = () => {
      const session = authService.getCurrentSession();
      if (session && session.user) {
        if (session.user.role === 'Customer') {
          const customers = getItem<any[]>(STORAGE_KEYS.CUSTOMERS, []);
          const cust = customers.find((c: any) => c.email?.toLowerCase() === session.user.email?.toLowerCase());
          if (cust) {
            session.user.accountStatus = cust.accountStatus || (cust.status === 'Suspended' ? 'SUSPENDED' : 'ACTIVE');
            session.user.status = cust.status === 'Suspended' ? 'Suspended' : cust.status === 'Pending Verification' ? 'Pending Verification' : cust.status === 'Pending' ? 'Pending' : 'Verified';
          }
        }
        setUser({ ...session.user });
        authService.checkProfileCompleteness(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    syncUser();

    window.addEventListener('storage_auth_updated', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('storage_auth_updated', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole, fullName?: string): Promise<AuthSession> => {
    const session = await authService.login(email, password, role, fullName);
    setUser(session.user);
    authService.checkProfileCompleteness(session.user);
    return session;
  };

  const socialLogin = async (provider: SocialProvider): Promise<AuthSession> => {
    const session = await authService.socialLogin(provider);
    setUser(session.user);
    authService.checkProfileCompleteness(session.user);
    return session;
  };

  const acceptSession = (session: AuthSession) => {
    setItem(STORAGE_KEYS.AUTH, session);
    setUser(session.user);
    authService.checkProfileCompleteness(session.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const register = async (dto: RegisterCustomerDTO) => {
    return await authService.registerCustomer(dto);
  };

  const verifyOTP = async (email: string, otp: string) => {
    return await authService.verifyOTP(email, otp);
  };

  const resendOTP = async (email: string) => {
    return await authService.resendOTP(email);
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    if (user) {
      let savedUser = updatedUser;
      try {
        const backendUser = await authService.updateProfile(updatedUser);
        if (backendUser) {
          savedUser = { ...updatedUser, ...backendUser };
        }
      } catch (err) {
        console.warn('Backend updateProfile error:', err);
      }

      const newUserData = { ...user, ...savedUser };
      setUser(newUserData);

      const session = authService.getCurrentSession();
      if (session) {
        session.user = newUserData;
        setItem(STORAGE_KEYS.AUTH, session);
      }

      // Sync with STORAGE_KEYS.USERS
      const users = getItem<any[]>(STORAGE_KEYS.USERS, []);
      const userIdx = users.findIndex((u: any) => u.email?.toLowerCase() === newUserData.email?.toLowerCase());
      if (userIdx !== -1) {
        users[userIdx] = { ...users[userIdx], ...newUserData };
        setItem(STORAGE_KEYS.USERS, users);
      }

      // Sync with STORAGE_KEYS.CUSTOMERS
      if (newUserData.role === 'Customer') {
        const customers = getItem<any[]>(STORAGE_KEYS.CUSTOMERS, []);
        const custIdx = customers.findIndex((c: any) => c.email?.toLowerCase() === newUserData.email?.toLowerCase());
        if (custIdx !== -1) {
          customers[custIdx] = {
            ...customers[custIdx],
            name: newUserData.fullName,
            firstName: newUserData.firstName,
            lastName: newUserData.lastName,
            phone: newUserData.phoneNumber || customers[custIdx].phone || '',
            address: newUserData.address || customers[custIdx].address || '',
            country: newUserData.country || customers[custIdx].country || 'India',
          };
          setItem(STORAGE_KEYS.CUSTOMERS, customers);
        }
      }

      authService.checkProfileCompleteness(newUserData);
    }
  };

  const getCurrentUser = () => user;

  const role = user?.role || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        socialLogin,
        acceptSession,
        logout,
        register,
        verifyOTP,
        resendOTP,
        updateUser,
        getCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthContext = useAuth;
