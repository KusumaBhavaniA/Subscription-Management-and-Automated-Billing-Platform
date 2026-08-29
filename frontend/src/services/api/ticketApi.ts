import { Ticket, TicketCategory, TicketStatus, TicketMessage } from '../../types/ticket';
import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';

export interface CreateTicketPayload {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  category: TicketCategory;
  subcategory?: string;
  subject: string;
  initialMessage: string;
  dynamicFields?: Record<string, string>;
}

const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      return parsed.token || parsed.access_token || parsed.user?.token || null;
    }
    return raw;
  } catch {
    return null;
  }
};

export const ticketApi = {
  getTickets: async (): Promise<Ticket[]> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/support/tickets', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tickets)) {
          return data.tickets as Ticket[];
        }
      }
    } catch (e) {
      console.warn('GET /support/tickets error:', e);
    }
    return getItem<Ticket[]>(STORAGE_KEYS.TICKETS, []);
  },

  getTicketById: async (id: string): Promise<Ticket | null> => {
    const list = await ticketApi.getTickets();
    return list.find((t) => t.id === id) || null;
  },

  createTicket: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category: payload.category,
          subcategory: payload.subcategory,
          subject: payload.subject,
          initialMessage: payload.initialMessage,
          dynamicFields: payload.dynamicFields,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const tickets = await ticketApi.getTickets();
          const created = tickets.find((t) => t.id === data.ticketId);
          if (created) return created;
        }
      }
    } catch (e) {
      console.warn('POST /support/tickets error:', e);
    }

    // Local storage fallback if offline
    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, []);
    const ticketId = `SUP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: Ticket = {
      id: ticketId,
      customerId: payload.customerId || 'CUS-000001',
      customerName: payload.customerName || 'Valued Customer',
      customerEmail: payload.customerEmail || '',
      category: payload.category || 'Billing & Payments',
      subcategory: payload.subcategory || '',
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
          senderName: payload.customerName || 'Customer',
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
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:8000/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        const tickets = await ticketApi.getTickets();
        const found = tickets.find((t) => t.id === ticketId);
        if (found) return found;
      }
    } catch (e) {
      console.warn(`POST /support/tickets/${ticketId}/messages error:`, e);
    }

    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, []);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
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
    }
    throw new Error('Ticket not found');
  },

  updateStatus: async (ticketId: string, status: TicketStatus): Promise<Ticket> => {
    const token = getAuthToken();
    try {
      const res = await fetch(`http://localhost:8000/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const tickets = await ticketApi.getTickets();
        const found = tickets.find((t) => t.id === ticketId);
        if (found) return found;
      }
    } catch (e) {
      console.warn(`PATCH /support/tickets/${ticketId}/status error:`, e);
    }

    const list = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, []);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].updatedDate = new Date().toISOString();
      setItem(STORAGE_KEYS.TICKETS, list);
      return list[idx];
    }
    throw new Error('Ticket not found');
  },

  assignAgent: async (ticketId: string, agentName: string): Promise<Ticket> => {
    const list = await ticketApi.getTickets();
    const found = list.find((t) => t.id === ticketId);
    if (found) {
      found.assignedAgent = agentName;
      return found;
    }
    return (await ticketApi.getTicketById(ticketId))!;
  },

  cancelTicket: async (ticketId: string): Promise<Ticket> => {
    return ticketApi.updateStatus(ticketId, 'Cancelled');
  },

  reopenTicket: async (ticketId: string): Promise<Ticket> => {
    return ticketApi.updateStatus(ticketId, 'Open');
  },
};

