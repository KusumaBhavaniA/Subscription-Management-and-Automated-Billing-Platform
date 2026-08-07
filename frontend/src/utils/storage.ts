export const STORAGE_KEYS = {
  THEME: 'billing_theme',
  AUTH: 'billing_auth',
  USERS: 'billing_users',
  PENDING_REGISTRATIONS: 'billing_pending_registrations',
  SETTINGS: 'billing_settings',
  NOTIFICATIONS: 'billing_notifications',
  INVOICES: 'billing_invoices',
  CUSTOMERS: 'billing_customers',
  SUBSCRIPTIONS: 'billing_subscriptions',
  PLANS: 'billing_plans',
  TICKETS: 'billing_tickets',
  PAYMENTS: 'billing_payments',
} as const;

export const getItem = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from LocalStorage`, error);
    return fallback;
  }
};

export const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} in LocalStorage`, error);
  }
};

export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from LocalStorage`, error);
  }
};
