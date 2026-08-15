export type TicketCategory =
  | 'Billing & Payments'
  | 'Subscription'
  | 'Account'
  | 'Account Suspension'
  | 'Technical'
  | 'General';

export type TicketStatus = 'Open' | 'In Progress' | 'Waiting for Customer' | 'Resolved' | 'Closed' | 'Cancelled';

export interface TicketMessage {
  id: string;
  senderRole: 'Customer' | 'Support' | 'Admin';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: { name: string; url: string; size: string }[];
}

export interface Ticket {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  category: TicketCategory;
  subcategory: string;
  status: TicketStatus;
  subject: string;
  createdDate: string;
  updatedDate: string;
  assignedAgent?: string;
  unreadMessagesCount?: number;
  dynamicFields?: Record<string, string>;
  messages: TicketMessage[];
}

export const SUPPORT_CATEGORIES: Record<TicketCategory, string[]> = {
  'Billing & Payments': [
    'Payment Failed',
    'Incorrect Charge',
    'Refund Request',
    'Invoice Issue',
    'Payment Method Update',
  ],
  Subscription: [
    'Upgrade Subscription',
    'Downgrade Subscription',
    'Cancel Subscription',
    'Renew Subscription',
    'Pause Subscription',
  ],
  Account: [
    'Account Suspension / Restoration',
    'Login Problem',
    'Email Verification',
    'Password Reset',
    'Profile Update',
    'Account Suspended',
  ],
  'Account Suspension': [
    'Request to Restore Suspended Account',
    'Suspension Appeal',
  ],
  Technical: [
    'Dashboard Issue',
    'Bug Report',
    'API Help',
  ],
  General: [
    'Feature Request',
    'General Question',
    'Other',
  ],
};
