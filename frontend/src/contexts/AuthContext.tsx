import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, RegisterCustomerDTO, AuthSession } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole, fullName?: string) => Promise<AuthSession>;
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
    const session = authService.getCurrentSession();
    if (session && session.user) {
      setUser(session.user);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole, fullName?: string): Promise<AuthSession> => {
    const session = await authService.login(email, password, role, fullName);
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

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newObj = { ...prev, ...updatedFields };
      const currentSession = authService.getCurrentSession();
      if (currentSession) {
        currentSession.user = newObj;
        localStorage.setItem('billing_auth', JSON.stringify(currentSession));
      }
      return newObj;
    });
  };

  const getCurrentUser = () => user;

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    verifyOTP,
    resendOTP,
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

