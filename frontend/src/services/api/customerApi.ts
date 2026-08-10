import { Customer } from '../../types/customer';
import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';

const getAuthToken = (): string | null => {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return parsed.token || parsed.access_token || null;
  } catch {
    return null;
  }
};

const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const customerApi = {
  /**
   * Fetch customer list for Admin by status filter: 'active' | 'suspended' | 'deleted'
   */
  getCustomers: async (filterTab: 'active' | 'suspended' | 'deleted' = 'active'): Promise<Customer[]> => {
    try {
      const token = getAuthToken();
      if (token) {
        const response = await fetch(`${BACKEND_URL}/auth/admin/customers?status_filter=${filterTab}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.data)) {
            const mapped: Customer[] = resData.data.map((u: any) => ({
              id: u.id,
              customerId: u.customerId,
              name: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              phone: u.phoneNumber || u.phone || '',
              status: u.status || (u.isVerified ? 'Verified' : 'Pending'),
              accountStatus: u.accountStatus || 'ACTIVE',
              isVerified: u.isVerified,
              subscriptionPlan: u.subscriptionPlan || u.currentPlan || 'Starter',
              subscriptionStatus: u.subscriptionStatus || 'Active',
              mrr: u.mrr || 4999,
              totalSpent: u.totalSpent || 0,
              joinedDate: u.joinedDate || u.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              registrationDate: u.registrationDate,
              country: u.country || 'India',
              deletedAt: u.deletedAt,
              deletedBy: u.deletedBy,
              suspendedAt: u.suspendedAt,
              suspendedBy: u.suspendedBy,
              suspensionReason: u.suspensionReason,
            }));
            return mapped;
          }
        }
      }
    } catch (err) {
      console.warn('Backend customer list fetch failed, falling back to local storage:', err);
    }

    // Fallback using LocalStorage
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    if (filterTab === 'active') {
      return list.filter(
        (c) =>
          c.isVerified !== false &&
          c.status !== 'Pending Verification' &&
          c.status !== 'Pending' &&
          c.accountStatus !== 'SUSPENDED' &&
          c.accountStatus !== 'DELETED' &&
          !c.deletedAt
      );
    } else if (filterTab === 'suspended') {
      return list.filter((c) => c.accountStatus === 'SUSPENDED' || c.status === 'Suspended');
    } else if (filterTab === 'deleted') {
      return list.filter((c) => c.accountStatus === 'DELETED' || !!c.deletedAt);
    }
    return list;
  },

  getCustomerById: async (id: string): Promise<Customer | null> => {
    const active = await customerApi.getCustomers('active');
    const suspended = await customerApi.getCustomers('suspended');
    const deleted = await customerApi.getCustomers('deleted');
    const all = [...active, ...suspended, ...deleted];
    return all.find((c) => c.id === id || c.customerId === id) || null;
  },

  /**
   * Admin suspends customer account
   */
  suspendCustomer: async (customerId: string, reason: string = ''): Promise<void> => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${BACKEND_URL}/auth/admin/customers/${customerId}/suspend`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        });
      }
    } catch (err) {
      console.error('Backend suspend request failed:', err);
    }

    // Sync LocalStorage
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex((c) => c.id === customerId || c.customerId === customerId);
    if (idx !== -1) {
      list[idx].accountStatus = 'SUSPENDED';
      list[idx].status = 'Suspended';
      list[idx].suspendedAt = new Date().toISOString();
      list[idx].suspensionReason = reason;
      setItem(STORAGE_KEYS.CUSTOMERS, list);
    }
  },

  /**
   * Admin restores customer account (from SUSPENDED or DELETED)
   */
  restoreCustomer: async (customerId: string): Promise<void> => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${BACKEND_URL}/auth/admin/customers/${customerId}/restore`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (err) {
      console.error('Backend restore request failed:', err);
    }

    // Sync LocalStorage
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex((c) => c.id === customerId || c.customerId === customerId);
    if (idx !== -1) {
      list[idx].accountStatus = 'ACTIVE';
      list[idx].status = 'Verified';
      list[idx].deletedAt = null;
      list[idx].deletedBy = null;
      list[idx].suspendedAt = null;
      list[idx].suspendedBy = null;
      list[idx].suspensionReason = null;
      setItem(STORAGE_KEYS.CUSTOMERS, list);
    }
  },

  /**
   * Admin soft-deletes customer account (moves to Recycle Bin)
   */
  softDeleteCustomer: async (customerId: string): Promise<void> => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${BACKEND_URL}/auth/admin/customers/${customerId}/soft-delete`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (err) {
      console.error('Backend soft-delete request failed:', err);
    }

    // Sync LocalStorage
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex((c) => c.id === customerId || c.customerId === customerId);
    if (idx !== -1) {
      list[idx].accountStatus = 'DELETED';
      list[idx].deletedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.CUSTOMERS, list);
    }
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
