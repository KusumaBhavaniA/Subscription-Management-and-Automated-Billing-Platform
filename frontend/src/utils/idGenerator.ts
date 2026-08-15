import { STORAGE_KEYS, getItem } from './storage';
import { Customer } from '../types/customer';
import { User } from '../types/auth';

/**
 * Generates a unique, non-duplicating customer ID in the format CUS-YYYY-XXXXXX (e.g. CUS-2026-000001).
 * Inspects localStorage for existing customer/user IDs to prevent collision.
 */
export const generateCustomerId = (): string => {
  const currentYear = new Date().getFullYear();
  const prefix = `CUS-${currentYear}-`;

  const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const users = getItem<User[]>(STORAGE_KEYS.USERS, []);

  let maxSeq = 0;

  const extractSeq = (idStr?: string) => {
    if (!idStr) return;
    if (idStr.startsWith(prefix)) {
      const seqPart = idStr.replace(prefix, '');
      const num = parseInt(seqPart, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    } else if (idStr.startsWith('CUS-')) {
      const parts = idStr.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  };

  customers.forEach((c) => {
    extractSeq(c.customerId);
    extractSeq(c.id);
  });

  users.forEach((u) => {
    extractSeq(u.customerId);
    extractSeq(u.id);
  });

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(6, '0');

  return `${prefix}${paddedSeq}`;
};

/**
 * Generates a unique support ticket ID in the format SUP-YYYY-XXXXXX (e.g. SUP-2026-000001).
 */
export const generateTicketId = (): string => {
  const currentYear = new Date().getFullYear();
  const prefix = `SUP-${currentYear}-`;

  const tickets = getItem<any[]>(STORAGE_KEYS.TICKETS, []);

  let maxSeq = 0;

  tickets.forEach((t) => {
    const idStr = t.id || t.ticketId;
    if (idStr && typeof idStr === 'string') {
      if (idStr.startsWith(prefix)) {
        const num = parseInt(idStr.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      } else if (idStr.startsWith('SUP-')) {
        const parts = idStr.split('-');
        if (parts.length >= 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(6, '0');

  return `${prefix}${paddedSeq}`;
};

