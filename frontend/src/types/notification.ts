export type NotificationType = 'Invoice Paid' | 'Subscription Renewed' | 'Payment Successful' | 'Payment Failed' | 'Subscription Expiring';

export interface NotificationItem {
  id: string;
  title: NotificationType;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
}
