export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  billingCycle?: 'Monthly' | 'Quarterly' | 'Yearly';
  features: string[];
  isPopular?: boolean;
  activeSubscribers: number;
  maxCustomers?: string;
  storage?: string;
  apiAccess?: string;
  supportLevel?: string;
  isEnabled?: boolean;
  mrr?: number;
}
