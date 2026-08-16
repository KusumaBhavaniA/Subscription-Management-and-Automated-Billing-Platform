export type NotificationType =
  | 'Invoice Generated'
  | 'Payment Successful'
  | 'Payment Failed'
  | 'Subscription Assigned'
  | 'Subscription Upgraded'
  | 'Subscription Downgraded'
  | 'Subscription Renewed'
  | 'Subscription Paused'
  | 'Subscription Cancelled'
  | 'Subscription Expired'
  | 'Subscription Updated'
  | 'Support Reply'
  | 'Ticket Assigned'
  | 'Ticket Closed'
  | 'Invoice Paid'
  | 'Subscription Expiring'
  | 'Profile Incomplete';

export interface NotificationItem {
  id: string;
  title: NotificationType | string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
  actionLabel?: string;
  actionUrl?: string;
}
