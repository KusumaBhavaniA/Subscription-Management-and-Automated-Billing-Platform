export type CustomerStatus = 'Verified' | 'Active' | 'Inactive' | 'Pending';

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
  mrr: number;
  totalSpent: number;
  joinedDate: string;
  registrationDate?: string;
  country: string;
  themePreference?: 'light' | 'dark' | 'system';
}

