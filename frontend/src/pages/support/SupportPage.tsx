import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Plus,
  Search,
  MessageSquare,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Shield,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../hooks/useAuth';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  SUPPORT_CATEGORIES,
} from '../../types/ticket';
import { ticketApi } from '../../services/api/ticketApi';
import { CustomerDetailsModal } from '../../components/customers/CustomerDetailsModal';
import { customerApi } from '../../services/api/customerApi';
import { Customer } from '../../types/customer';

export const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'Resolved' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Create Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>('Billing & Payments');
  const [subcategory, setSubcategory] = useState<string>('Payment Failed');
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Category Specific Dynamic Fields (Step 11)
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reason, setReason] = useState('');

  // Chat State (Step 13)
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Admin View Customer Modal (Step 14)
  const [inspectCustomer, setInspectCustomer] = useState<Customer | null>(null);

  const loadTickets = async () => {
    const list = await ticketApi.getTickets();
    if (isAdmin) {
      setTickets(list);
    } else {
      setTickets(list.filter((t) => t.customerEmail?.toLowerCase() === user?.email.toLowerCase()));
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user, isAdmin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Update subcategory options when category changes
  useEffect(() => {
    const available = SUPPORT_CATEGORIES[category] || [];
    if (available.length > 0) {
      setSubcategory(available[0]);
    }
  }, [category]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

    // Collect dynamic fields per category (Step 11)
    const dynamicFields: Record<string, string> = {};
    if (subcategory === 'Payment Failed') {
      if (invoiceNumber) dynamicFields['Invoice Number'] = invoiceNumber;
      if (transactionId) dynamicFields['Transaction ID'] = transactionId;
      if (paymentMethod) dynamicFields['Payment Method'] = paymentMethod;
    } else if (subcategory === 'Cancel Subscription') {
      if (reason) dynamicFields['Reason'] = reason;
    } else if (subcategory === 'Refund Request') {
      if (invoiceNumber) dynamicFields['Invoice Number'] = invoiceNumber;
      if (reason) dynamicFields['Reason'] = reason;
    }

    try {
      const created = await ticketApi.createTicket({
        customerId: user?.customerId || `CUS-${Date.now()}`,
        customerName: user?.fullName || 'Valued Customer',
        customerEmail: user?.email || 'customer@example.com',
        category,
        subcategory,
        subject,
        initialMessage,
        dynamicFields,
      });

      await loadTickets();
      setSelectedTicket(created);
      setIsCreateModalOpen(false);

      // Reset Form
      setSubject('');
      setInitialMessage('');
      setInvoiceNumber('');
      setTransactionId('');
      setPaymentMethod('');
      setReason('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSending(true);
    try {
      const updated = await ticketApi.addReply(
        selectedTicket.id,
        isAdmin ? 'Support' : 'Customer',
        user?.fullName || (isAdmin ? 'Support Specialist' : 'Customer'),
        replyText
      );
      setSelectedTicket(updated);
      await loadTickets();
      setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    const updated = await ticketApi.updateStatus(ticketId, status);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(updated);
    }
    await loadTickets();
  };

  const handleAssignAgent = async (ticketId: string, agentName: string) => {
    const updated = await ticketApi.assignAgent(ticketId, agentName);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(updated);
    }
    await loadTickets();
  };

  const handleCancelTicket = async (ticketId: string) => {
    try {
      const updated = await ticketApi.cancelTicket(ticketId);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(updated);
      }
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel ticket');
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    try {
      const updated = await ticketApi.reopenTicket(ticketId);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(updated);
      }
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen ticket');
    }
  };

  const handleViewCustomerProfile = async (email: string) => {
    const cust = await customerApi.getCustomerById(email);
    if (cust) {
      setInspectCustomer(cust);
    } else {
      // Fallback object for customer modal
      setInspectCustomer({
        id: `cust-${Date.now()}`,
        name: selectedTicket?.customerName || email,
        email,
        phone: '+91 9876543210',
        status: 'Verified',
        subscriptionPlan: 'Pro Business',
        mrr: 4999,
        totalSpent: 14997,
        joinedDate: '2026-01-01',
        country: 'India',
      });
    }
  };

  // Filtered Tickets List
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'All') return true;
    if (activeTab === 'Open') return t.status === 'Open' || t.status === 'In Progress';
    if (activeTab === 'Resolved') return t.status === 'Resolved';
    if (activeTab === 'Cancelled') return t.status === 'Cancelled';
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return <Badge variant="warning">Open</Badge>;
      case 'In Progress':
        return <Badge variant="brand">In Progress</Badge>;
      case 'Waiting for Customer':
        return <Badge variant="info">Waiting for Customer</Badge>;
      case 'Resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'Closed':
        return <Badge variant="neutral">Closed</Badge>;
      case 'Cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <Headphones className="w-6 h-6 text-primary" />
            {isAdmin ? 'Support Ticket Operations' : 'Help & Support Center'}
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            {isAdmin
              ? 'Manage customer inquiries, assign tickets, and communicate directly with customers.'
              : 'Submit support requests, track resolution progress, and chat with technical specialists.'}
          </p>
        </div>

        {!isAdmin && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Raise Ticket
          </Button>
        )}
      </div>

      {/* TICKET DIRECTORY & CHAT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TICKETS LIST (STEP 12) */}
        <div className={`lg:col-span-5 space-y-4 ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
          <Card className="p-4 space-y-4">
            {/* Search & Tabs */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
              <input
                type="text"
                placeholder="Search tickets by ID, subject, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border no-scrollbar">
              {(['All', 'Open', 'Resolved', 'Cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondaryText hover:text-primaryText hover:bg-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List items */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 divide-y divide-border/60">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-xs font-medium text-mutedText">
                  No tickets found.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`pt-2.5 p-3 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                          : 'border-transparent hover:border-border hover:bg-cardHover'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs text-primary">{t.id}</span>
                          {getStatusBadge(t.status)}
                        </div>
                        <span className="text-[10px] font-medium text-mutedText">
                          {new Date(t.updatedDate).toLocaleDateString('en-GB')}
                        </span>
                      </div>

                      <h4 className="text-xs font-extrabold text-heading mt-1.5 line-clamp-1">{t.subject}</h4>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[10px] text-secondaryText">
                        <span className="font-semibold text-primaryText truncate max-w-[150px]">
                          {t.category} ({t.subcategory})
                        </span>
                        <div className="flex items-center gap-1 text-mutedText">
                          <User className="w-3 h-3 text-mutedText" />
                          <span className="truncate max-w-[100px]">{t.assignedAgent || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: CHAT & DETAILS (STEP 13 & STEP 14) */}
        <div className={`lg:col-span-7 ${!selectedTicket ? 'hidden lg:block' : 'block'}`}>
          {selectedTicket ? (
            <Card className="flex flex-col h-[680px] p-0 overflow-hidden border border-border">
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-slate-50 dark:bg-[#1E293B] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="lg:hidden p-1.5 rounded-lg hover:bg-secondary text-secondaryText"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-primary">{selectedTicket.id}</span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <h3 className="text-sm font-extrabold text-heading truncate max-w-xs sm:max-w-md mt-0.5">
                      {selectedTicket.subject}
                    </h3>
                  </div>
                </div>

                {/* Ticket Toolbar Action Controls */}
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ExternalLink className="w-3.5 h-3.5 text-primary" />}
                        onClick={() => handleViewCustomerProfile(selectedTicket.customerEmail)}
                      >
                        View Customer
                      </Button>

                      <Select
                        value={selectedTicket.assignedAgent || 'Unassigned'}
                        onChange={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
                        options={[
                          { value: 'Unassigned', label: 'Unassigned Agent' },
                          { value: 'Sarah Connor', label: 'Sarah Connor' },
                          { value: 'Alex Turner', label: 'Alex Turner' },
                          { value: 'Dev Support Team', label: 'Dev Support Team' },
                        ]}
                      />

                      <Select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                        options={[
                          { value: 'Open', label: 'Status: Open' },
                          { value: 'In Progress', label: 'Status: In Progress' },
                          { value: 'Waiting for Customer', label: 'Status: Waiting for Customer' },
                          { value: 'Resolved', label: 'Status: Resolved' },
                          { value: 'Closed', label: 'Status: Closed' },
                          { value: 'Cancelled', label: 'Status: Cancelled' },
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      {/* Customer Actions */}
                      {selectedTicket.status === 'Open' && !selectedTicket.messages.some((m) => m.senderRole !== 'Customer') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelTicket(selectedTicket.id)}
                          className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50"
                        >
                          Cancel Ticket
                        </Button>
                      )}

                      {(selectedTicket.status === 'Open' || selectedTicket.status === 'In Progress') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(selectedTicket.id, 'Resolved')}
                        >
                          Close Ticket
                        </Button>
                      )}

                      {(selectedTicket.status === 'Resolved' || selectedTicket.status === 'Cancelled') && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReopenTicket(selectedTicket.id)}
                        >
                          Reopen Ticket
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Fields Banner (Step 11) */}
              {selectedTicket.dynamicFields && Object.keys(selectedTicket.dynamicFields).length > 0 && (
                <div className="p-3 bg-secondary/80 border-b border-border flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <span className="text-mutedText font-bold uppercase text-[10px] tracking-wider">Ticket Info:</span>
                  {Object.entries(selectedTicket.dynamicFields).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <span className="text-secondaryText font-bold">{k}:</span>
                      <span className="text-primary font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages Thread (Step 13) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-app-bg">
                {selectedTicket.messages.map((msg) => {
                  const isUser = msg.senderRole === 'Customer';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-mutedText font-semibold">
                        <span className="text-heading font-extrabold">{msg.senderName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary uppercase font-bold text-secondaryText">
                          {msg.senderRole}
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed font-medium shadow-sm ${
                          isUser
                            ? 'bg-white dark:bg-[#1E293B] text-heading border border-border rounded-tl-none'
                            : 'bg-primary text-white rounded-tr-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Composer */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-card flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your response here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSending}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="h-[680px] flex flex-col items-center justify-center text-center p-8 border border-border">
              <MessageSquare className="w-12 h-12 text-primary opacity-60 mb-3" />
              <h3 className="text-base font-extrabold text-heading">No Ticket Selected</h3>
              <p className="text-xs text-secondaryText mt-1 max-w-sm">
                Select a ticket from the left panel to inspect conversation history, respond, or update status.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* CREATE TICKET MODAL WITH DYNAMIC FIELDS */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Raise Support Ticket"
        description="Submit a support inquiry. Technical specialists will respond directly inside this ticket thread."
        size="xl"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          {/* Category & Specific Issue - 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Support Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              options={Object.keys(SUPPORT_CATEGORIES).map((c) => ({ value: c, label: c }))}
            />

            <Select
              label="Specific Issue *"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              options={(SUPPORT_CATEGORIES[category] || []).map((sub) => ({ value: sub, label: sub }))}
            />
          </div>

          {/* DYNAMIC FIELDS PER CATEGORY */}
          {category === 'Billing & Payments' && (
            <div className="p-3.5 rounded-xl bg-secondary/80 border border-border space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Billing & Payment Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(subcategory === 'Payment Failed' || subcategory === 'Incorrect Charge' || subcategory === 'Refund Request' || subcategory === 'Invoice Issue') && (
                  <Input label="Invoice Number" placeholder="e.g. INV-2026-002" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                )}
                {subcategory === 'Payment Failed' && (
                  <Input label="Transaction ID" placeholder="e.g. TXN-987123" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                )}
              </div>

              {subcategory === 'Payment Failed' && (
                <Input label="Payment Method Used" placeholder="Credit Card / UPI / NetBanking" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              )}
              {(subcategory === 'Refund Request' || subcategory === 'Cancel Subscription') && (
                <Input label="Reason for Request" placeholder="Please provide background details" value={reason} onChange={(e) => setReason(e.target.value)} />
              )}
              {subcategory === 'Payment Method Update' && (
                <Input label="Preferred Payment Method" placeholder="e.g. New Credit Card / Corporate NetBanking" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              )}
            </div>
          )}

          {category === 'Subscription' && (
            <div className="p-3.5 rounded-xl bg-secondary/80 border border-border space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Subscription Context</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(subcategory === 'Upgrade Subscription' || subcategory === 'Downgrade Subscription') && (
                  <Input label="Target Plan Tier" placeholder="e.g. Pro Business / Enterprise Scale" value={reason} onChange={(e) => setReason(e.target.value)} />
                )}
                {subcategory === 'Cancel Subscription' && (
                  <Input label="Cancellation Reason *" placeholder="Why are you cancelling?" value={reason} onChange={(e) => setReason(e.target.value)} required />
                )}
                {subcategory === 'Pause Subscription' && (
                  <Input label="Pause Duration" placeholder="e.g. 1 Month / 2 Months" value={reason} onChange={(e) => setReason(e.target.value)} />
                )}
              </div>
            </div>
          )}

          {category === 'Account' && (
            <div className="p-3.5 rounded-xl bg-secondary/80 border border-border space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Account Details</span>
              <Input label="Account Email / Customer ID" placeholder="user@company.com" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
          )}

          {category === 'Technical' && (
            <div className="p-3.5 rounded-xl bg-secondary/80 border border-border space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Technical Environment</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subcategory === 'API Help' && (
                  <Input label="API Endpoint URL" placeholder="e.g. /api/v1/subscriptions" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                )}
                {(subcategory === 'Dashboard Issue' || subcategory === 'Bug Report') && (
                  <Input label="Browser & Operating System" placeholder="e.g. Chrome 126 on Windows 11" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                )}
              </div>
            </div>
          )}

          <Input label="Subject Summary *" placeholder="Brief title describing the issue" value={subject} onChange={(e) => setSubject(e.target.value)} required />

          <div>
            <label className="block text-xs font-bold text-secondaryText mb-1.5 uppercase tracking-wider">Detailed Description *</label>
            <textarea
              rows={3}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Explain the problem in detail..."
              required
              className="w-full p-3 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium resize-y"
            />
          </div>

          {/* Attachments Section (Future-Ready) */}
          <div className="p-3 rounded-xl border border-dashed border-border text-center bg-secondary/40 space-y-1">
            <span className="text-[11px] font-bold text-secondaryText block">Attach Screenshots / Diagnostics (Future Ready)</span>
            <p className="text-[10px] text-mutedText">Drag & drop files or click to attach logs (PNG, JPG, PDF up to 10MB)</p>
          </div>

          {/* Sticky Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card z-10">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* ADMIN INSPECT CUSTOMER PROFILE MODAL (STEP 14) */}
      {inspectCustomer && (
        <CustomerDetailsModal
          customer={inspectCustomer}
          isOpen={!!inspectCustomer}
          onClose={() => setInspectCustomer(null)}
        />
      )}
    </div>
  );
};
