import { Customer } from '../../types/customer';
import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';

export const syncUserAndAuthStatus = (
  email: string,
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETED',
  status: any
) => {
  const cleanEmail = email.toLowerCase();

  // Sync USERS array in localStorage
  const users = getItem<any[]>(STORAGE_KEYS.USERS, []);
  const userIdx = users.findIndex((u) => u.email?.toLowerCase() === cleanEmail);
  if (userIdx !== -1) {
    users[userIdx].accountStatus = accountStatus;
    users[userIdx].status = status;
    setItem(STORAGE_KEYS.USERS, users);
  }

  // Sync AUTH session if active user matches
  const currentSession = getItem<any>(STORAGE_KEYS.AUTH, null);
  if (currentSession && currentSession.user && currentSession.user.email?.toLowerCase() === cleanEmail) {
    currentSession.user.accountStatus = accountStatus;
    currentSession.user.status = status;
    setItem(STORAGE_KEYS.AUTH, currentSession);
  }

  window.dispatchEvent(new Event('storage_auth_updated'));
};

export const customerApi = {
  /**
   * Fetch customer list for Admin by status filter: 'active' | 'suspended' | 'deleted'
   */
  getCustomers: async (filterTab: 'active' | 'suspended' | 'deleted' = 'active'): Promise<Customer[]> => {
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
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const cleanId = id.trim().toLowerCase();
    return (
      list.find(
        (c) =>
          c.id?.toLowerCase() === cleanId ||
          c.customerId?.toLowerCase() === cleanId ||
          c.email?.toLowerCase() === cleanId
      ) || null
    );
  },

  /**
   * Admin suspends customer account
   */
  suspendCustomer: async (customerId: string, reason: string = ''): Promise<void> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex(
      (c) =>
        c.id === customerId ||
        c.customerId === customerId ||
        c.email?.toLowerCase() === customerId.toLowerCase()
    );

    if (idx !== -1) {
      list[idx].accountStatus = 'SUSPENDED';
      list[idx].status = 'Suspended';
      list[idx].suspendedAt = new Date().toISOString();
      list[idx].suspensionReason = reason;
      setItem(STORAGE_KEYS.CUSTOMERS, list);
      syncUserAndAuthStatus(list[idx].email, 'SUSPENDED', 'Suspended');
    }
  },

  /**
   * Admin restores customer account (from SUSPENDED or DELETED)
   */
  restoreCustomer: async (customerId: string): Promise<void> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex(
      (c) =>
        c.id === customerId ||
        c.customerId === customerId ||
        c.email?.toLowerCase() === customerId.toLowerCase()
    );

    if (idx !== -1) {
      list[idx].accountStatus = 'ACTIVE';
      list[idx].status = 'Verified';
      list[idx].isVerified = true;
      list[idx].deletedAt = null;
      list[idx].deletedBy = null;
      list[idx].suspendedAt = null;
      list[idx].suspendedBy = null;
      list[idx].suspensionReason = null;
      setItem(STORAGE_KEYS.CUSTOMERS, list);
      syncUserAndAuthStatus(list[idx].email, 'ACTIVE', 'Verified');
    }
  },

  /**
   * Admin soft-deletes customer account (moves to Recycle Bin)
   */
  softDeleteCustomer: async (customerId: string): Promise<void> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex(
      (c) =>
        c.id === customerId ||
        c.customerId === customerId ||
        c.email?.toLowerCase() === customerId.toLowerCase()
    );

    if (idx !== -1) {
      list[idx].accountStatus = 'DELETED';
      list[idx].deletedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.CUSTOMERS, list);
      syncUserAndAuthStatus(list[idx].email, 'DELETED', 'Inactive');
    }
  },

  assignPlan: async (customerId: string, planName: string, mrr: number): Promise<Customer> => {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex(
      (c) =>
        c.id === customerId ||
        c.customerId === customerId ||
        c.email?.toLowerCase() === customerId.toLowerCase()
    );

    if (idx === -1) throw new Error('Customer not found');

    list[idx].subscriptionPlan = planName;
    list[idx].subscriptionStatus = 'Active';
    list[idx].mrr = mrr;
    setItem(STORAGE_KEYS.CUSTOMERS, list);
    return list[idx];
  },
};
