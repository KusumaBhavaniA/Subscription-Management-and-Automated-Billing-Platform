export type UserRole = 'Admin' | 'Customer';

export interface User {
  id: string;
  customerId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  role: UserRole;
  createdAt: string;
  status?: 'Verified' | 'Pending';
  registrationDate?: string;
  currentPlan?: string;
  subscriptionStatus?: string;
  themePreference?: 'light' | 'dark' | 'system';
}

export interface RegisterCustomerDTO {
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  country?: string;
  phoneCode?: string;
  acceptTerms: boolean;
}

export interface PendingRegistration {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  country: string;
  phoneCode: string;
  passwordHash: string;
  otp: string;
  otpExpiresAt: string;
  createdAt: string;
}

export interface OTPVerificationDTO {
  email: string;
  otp: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

