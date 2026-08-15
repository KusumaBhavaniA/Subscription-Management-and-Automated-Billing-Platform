export type CustomerStatus = 'Verified' | 'Active' | 'Inactive' | 'Pending' | 'Pending Verification' | 'Suspended';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface Customer {
  id: string;
  customerId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  accountStatus?: AccountStatus;
  isVerified?: boolean;
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
  deletedAt?: string | null;
  deletedBy?: string | null;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  suspensionReason?: string | null;
}
