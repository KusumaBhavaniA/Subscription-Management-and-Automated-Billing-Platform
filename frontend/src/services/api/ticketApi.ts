import { Ticket, TicketCategory, TicketStatus, TicketMessage } from '../../types/ticket';
import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';

export interface CreateTicketPayload {
  customerId: string;
  customerName: string;
  customerEmail: string;
  category: TicketCategory;
  subcategory: string;
  subject: string;
  initialMessage: string;
  dynamicFields?: Record<string, string>;
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-2026-001',
    customerId: 'CUS-2026-000001',
    customerName: 'Rohan Sharma',
    customerEmail: 'rohan.sharma@techcorp.in',
    category: 'Billing & Payments',
    subcategory: 'Payment Failed',
    status: 'Open',
    subject: 'Card charge failed for INV-2026-002',
    createdDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    assignedAgent: 'Sarah Connor',
    unreadMessagesCount: 1,
    dynamicFields: {
      'Invoice Number': 'INV-2026-002',
      'Transaction ID': 'TXN-98712399',
      'Payment Method': 'Credit Card (Visa)',
    },
    messages: [
      {
        id: 'msg-1',
        senderRole: 'Customer',
        senderName: 'Rohan Sharma',
        message: 'My payment for invoice INV-2026-002 failed with code ERR_CARD_DECLINED. Could you please check on the payment gateway side?',
        timestamp: 'Yesterday at 14:30',
      },
      {
        id: 'msg-2',
        senderRole: 'Support',
        senderName: 'Sarah Connor',
        message: 'Hello Rohan, thanks for reaching out. We see a temporary bank block on Visa cards ending in 4242. Please update your payment method or retry.',
        timestamp: 'Today at 09:15',
      },
    ],
  },
  {
    id: 'TCK-2026-002',
    customerId: 'CUS-2026-000002',
    customerName: 'Priya Sundaram',
    customerEmail: 'priya@datasolutions.com',
    category: 'Subscription',
    subcategory: 'Upgrade Subscription',
    status: 'In Progress',
    subject: 'Upgrade to Enterprise Scale annual plan',
    createdDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    assignedAgent: 'Alex Turner',
    unreadMessagesCount: 0,
    dynamicFields: {
      'Target Plan': 'Enterprise Scale',
      'Billing Preference': 'Annual (Discounted)',
    },
    messages: [
      {
        id: 'msg-3',
        senderRole: 'Customer',
        senderName: 'Priya Sundaram',
        message: 'We want to switch our account from Pro Business monthly to Enterprise Scale yearly to get dedicated SLA support.',
        timestamp: '2 days ago',
      },
      {
        id: 'msg-4',
        senderRole: 'Support',
        senderName: 'Alex Turner',
        message: 'Hi Priya! I have prepared the custom invoice for Enterprise Scale annual billing with a 20% tier discount.',
        timestamp: '5 hours ago',
      },
    ],
  },
  {
    id: 'TCK-2026-003',
    customerId: 'CUS-2026-000003',
    customerName: 'Aarav Mehta',
    customerEmail: 'aarav@cloudnexus.io',
    category: 'Technical',
    subcategory: 'API Help',
    status: 'Resolved',
    subject: 'Webhook signature verification failing',
    createdDate: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    assignedAgent: 'Dev Support Team',
    unreadMessagesCount: 0,
    dynamicFields: {
      'API Endpoint': '/api/v1/webhooks',
      'SDK Version': 'v2.4.0',
    },
    messages: [
      {
        id: 'msg-5',
        senderRole: 'Customer',
        senderName: 'Aarav Mehta',
        message: 'We are receiving HTTP 401 when validating webhook signatures. What is the hash algorithm used?',
        timestamp: '3 days ago',
      },
      {
        id: 'msg-6',
        senderRole: 'Support',
        senderName: 'Dev Support Team',
        message: 'Hello Aarav, signatures use HMAC-SHA256 with the secret header `X-Billing-Signature`. Check our documentation snippet!',
        timestamp: 'Yesterday at 18:00',
      },
    ],
  },
];

export const ticketApi = {
  getTickets: async (): Promise<Ticket[]> => {
    return getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  },

  getTicketById: async (id: string): Promise<Ticket | null> => {
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    return list.find((t) => t.id === id) || null;
  },

  createTicket: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    const ticketId = `TCK-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newTicket: Ticket = {
      id: ticketId,
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      category: payload.category,
      subcategory: payload.subcategory,
      status: 'Open',
      subject: payload.subject.trim(),
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      assignedAgent: 'Unassigned',
      unreadMessagesCount: 0,
      dynamicFields: payload.dynamicFields || {},
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderRole: 'Customer',
          senderName: payload.customerName,
          message: payload.initialMessage.trim(),
          timestamp: 'Just now',
        },
      ],
    };

    list.unshift(newTicket);
    setItem(STORAGE_KEYS.TICKETS, list);
    return newTicket;
  },

  addReply: async (
    ticketId: string,
    senderRole: 'Customer' | 'Support' | 'Admin',
    senderName: string,
    message: string,
    attachments?: { name: string; url: string; size: string }[]
  ): Promise<Ticket> => {
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderRole,
      senderName,
      message: message.trim(),
      timestamp: 'Just now',
      attachments,
    };

    list[idx].messages.push(newMessage);
    list[idx].updatedDate = new Date().toISOString();
    if (senderRole !== 'Customer') {
      list[idx].status = list[idx].status === 'Open' ? 'In Progress' : list[idx].status;
    }

    setItem(STORAGE_KEYS.TICKETS, list);
    return list[idx];
  },

  updateStatus: async (ticketId: string, status: TicketStatus): Promise<Ticket> => {
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    list[idx].status = status;
    list[idx].updatedDate = new Date().toISOString();

    setItem(STORAGE_KEYS.TICKETS, list);
    return list[idx];
  },

  assignAgent: async (ticketId: string, agentName: string): Promise<Ticket> => {
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    list[idx].assignedAgent = agentName;
    list[idx].updatedDate = new Date().toISOString();

    setItem(STORAGE_KEYS.TICKETS, list);
    return list[idx];
  },

  cancelTicket: async (ticketId: string): Promise<Ticket> => {
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    // Customer can cancel before support starts
    if (list[idx].messages.some((m) => m.senderRole !== 'Customer')) {
      throw new Error('Cannot cancel ticket after support response. Please request ticket closure instead.');
    }

    list[idx].status = 'Cancelled';
    list[idx].updatedDate = new Date().toISOString();
    setItem(STORAGE_KEYS.TICKETS, list);
    return list[idx];
  },

  reopenTicket: async (ticketId: string): Promise<Ticket> => {
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    // Check if within 7 days
    const createdTime = new Date(list[idx].createdDate).getTime();
    const now = Date.now();
    const diffDays = (now - createdTime) / (1000 * 3600 * 24);
    if (diffDays > 7) {
      throw new Error('Resolved tickets can only be reopened within 7 days of creation/resolution. Please raise a new ticket.');
    }

    list[idx].status = 'In Progress';
    list[idx].updatedDate = new Date().toISOString();
    setItem(STORAGE_KEYS.TICKETS, list);
    return list[idx];
  },
};
