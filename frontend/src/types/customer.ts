export type CustomerStatus = 'Verified' | 'Active' | 'Inactive' | 'Pending' | 'Pending Verification' | 'Suspended';

export interface Customer {
  id: string;
  customerId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  subscriptionPlan: string;
  subscriptionStatus?: 'Active' | 'Inactive' | 'Cancelled' | 'Expired' | 'Past Due' | 'Trialing' | 'Paused';
  mrr: number;
  totalSpent: number;
  joinedDate: string;
  registrationDate?: string;
  country: string;
  address?: string;
  avatarUrl?: string;
  themePreference?: 'light' | 'dark' | 'system';
}
