import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, RegisterCustomerDTO, AuthSession, SocialProvider } from '../types/auth';
import { authService } from '../services/authService';
import { STORAGE_KEYS, setItem } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole, fullName?: string) => Promise<AuthSession>;
  socialLogin: (provider: SocialProvider) => Promise<AuthSession>;
  logout: () => void;
  register: (dto: RegisterCustomerDTO) => Promise<{ email: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateUser: (updatedUser: Partial<User>) => void;
  getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount: validate stored JWT against GET /auth/me so expired tokens are
  // caught immediately and the user object is always fresh from the DB.
  useEffect(() => {
    const restoreSession = async () => {
      const session = authService.getCurrentSession();
      if (!session?.token) {
        setIsLoading(false);
        return;
      }
      const freshUser = await authService.fetchCurrentUser();
      if (freshUser) {
        setUser(freshUser);
      } else {
        authService.logout();
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole,
    _fullName?: string,
  ): Promise<AuthSession> => {
    const session = await authService.login(email, password, role);
    setUser(session.user);
    return session;
  };

  const socialLogin = async (provider: SocialProvider): Promise<AuthSession> => {
    const session = await authService.socialLogin(provider);
    setUser(session.user);
    return session;
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

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await authService.forgotPassword(email);
    return { success: response.success, message: response.message };
  };

  const resetPassword = async (
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await authService.resetPassword(token, newPassword);
    return { success: response.success, message: response.message };
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      const currentSession = authService.getCurrentSession();
      if (currentSession) {
        setItem(STORAGE_KEYS.AUTH, { ...currentSession, user: updated });
      }
      return updated;
    });
  };

  const getCurrentUser = () => user;

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    isLoading,
    login,
    socialLogin,
    logout,
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    updateUser,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Alias kept for backwards compatibility with any teammate code using useAuthContext
export const useAuthContext = useAuth;
