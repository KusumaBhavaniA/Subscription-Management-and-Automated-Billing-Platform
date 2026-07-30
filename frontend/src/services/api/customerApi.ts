import { Customer, CustomerStatus } from '../../types/customer';
import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country?: string;
  address?: string;
}

export const customerApi = {
  getCustomers: async (): Promise<Customer[]> => {
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  },

  getCustomerById: async (id: string): Promise<Customer | null> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    return list.find((c) => c.id === id || c.customerId === id) || null;
  },

  /**
   * STEP 5: Create Customer
   * Manually created by Admin.
   * Only creates the customer profile.
   * Do NOT assign a subscription automatically (No Plan, Inactive, MRR ₹0.00).
   */
  createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const cleanEmail = payload.email.trim().toLowerCase();
    
    if (list.some((c) => c.email.toLowerCase() === cleanEmail)) {
      throw new Error('Customer with this email address already exists.');
    }

    const customerId = `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      customerId,
      name: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: cleanEmail,
      phone: payload.phone.trim(),
      status: 'Verified',
      subscriptionPlan: 'None',
      subscriptionStatus: 'Inactive',
      mrr: 0,
      totalSpent: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      registrationDate: new Date().toLocaleDateString('en-GB'),
      country: payload.country || 'India',
      address: payload.address || '',
      themePreference: 'light',
    };

    list.unshift(newCust);
    setItem(STORAGE_KEYS.CUSTOMERS, list);
    return newCust;
  },

  updateCustomerStatus: async (customerId: string, status: CustomerStatus): Promise<Customer> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex((c) => c.id === customerId || c.customerId === customerId);
    if (idx === -1) throw new Error('Customer not found');

    list[idx].status = status;
    setItem(STORAGE_KEYS.CUSTOMERS, list);
    return list[idx];
  },

  assignPlan: async (customerId: string, planName: string, mrr: number): Promise<Customer> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex((c) => c.id === customerId || c.customerId === customerId);
    if (idx === -1) throw new Error('Customer not found');

    list[idx].subscriptionPlan = planName;
    list[idx].subscriptionStatus = 'Active';
    list[idx].mrr = mrr;
    setItem(STORAGE_KEYS.CUSTOMERS, list);
    return list[idx];
  },
};
