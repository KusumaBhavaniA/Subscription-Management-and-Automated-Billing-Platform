export interface WorkspaceSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  appearance: {
    theme: 'light' | 'dark';
    accentColor: 'blue' | 'indigo' | 'purple' | 'green';
    fontSize: 'small' | 'medium' | 'large';
  };
  notifications: {
    emailNotifications: boolean;
    billingAlerts: boolean;
    invoiceAlerts: boolean;
    subscriptionRenewalAlerts: boolean;
    securityAlerts: boolean;
    emailInvoices?: boolean;
    paymentAlerts?: boolean;
    subscriptionReminders?: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: boolean;
  };
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  currency: 'INR (₹)',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'Indian',
  appearance: {
    theme: 'light',
    accentColor: 'indigo',
    fontSize: 'large',
  },
  notifications: {
    emailNotifications: true,
    billingAlerts: true,
    invoiceAlerts: true,
    subscriptionRenewalAlerts: true,
    securityAlerts: true,
    emailInvoices: true,
    paymentAlerts: true,
    subscriptionReminders: true,
  },
  security: {
    twoFactor: false,
    sessionTimeout: true,
  },
};

