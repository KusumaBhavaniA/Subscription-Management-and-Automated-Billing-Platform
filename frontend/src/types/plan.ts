export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
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
