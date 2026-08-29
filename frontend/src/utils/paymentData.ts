import { PaymentTransaction } from '../types/payment';
import { getItem, setItem, STORAGE_KEYS } from './storage';

export const DEFAULT_MOCK_PAYMENTS: PaymentTransaction[] = [];

/**
 * Get payment transactions from localStorage
 */
export const getPaymentTransactions = (): PaymentTransaction[] => {
  const stored = getItem<PaymentTransaction[]>(STORAGE_KEYS.PAYMENTS, []);
  return stored || [];
};

/**
 * Save new payment transaction to storage
 */
export const savePaymentTransaction = (txn: PaymentTransaction): void => {
  const current = getPaymentTransactions();
  const updated = [txn, ...current.filter((t) => t.id !== txn.id)];
  setItem(STORAGE_KEYS.PAYMENTS, updated);
};
