import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Plus,
  Search,
  MessageSquare,
  Send,
  User,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
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
  const isCustomerSuspended = !isAdmin && (user?.accountStatus === 'SUSPENDED' || user?.status === 'Suspended');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'Resolved' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Dedicated Restoration Request State
  const [restorationMessage, setRestorationMessage] = useState('');
  const [isSubmittingRestoration, setIsSubmittingRestoration] = useState(false);
  const [restorationNotice, setRestorationNotice] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Create Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>('Billing & Payments');
  const [subcategory, setSubcategory] = useState<string>('Payment Failed');
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Dynamic Fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reason, setReason] = useState('');

  // Chat State
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Admin View Customer Modal
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

  useEffect(() => {
    const available = SUPPORT_CATEGORIES[category] || [];
    if (available.length > 0) {
      setSubcategory(available[0]);
    }
  }, [category]);

  const handleRestorationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restorationMessage.trim()) return;

    setIsSubmittingRestoration(true);
    setRestorationNotice(null);
    try {
      const created = await ticketApi.createTicket({
        customerId: user?.customerId || `CUS-${Date.now()}`,
        customerName: user?.fullName || 'Valued Customer',
        customerEmail: user?.email || 'customer@example.com',
        category: 'Account Suspension',
        subcategory: 'Request to Restore Suspended Account',
        subject: 'Request to Restore Suspended Account',
        initialMessage: restorationMessage.trim(),
        dynamicFields: {
          'Category': 'Account Suspension',
          'Subject': 'Request to Restore Suspended Account',
          'Account Status': 'SUSPENDED',
        },
      });

      await loadTickets();
      setSelectedTicket(created);
      setRestorationNotice('Your restoration request has been submitted successfully.');
      setRestorationMessage('');
      setToastMessage('Your restoration request has been submitted successfully.');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error(err);
      setToastMessage('Failed to submit restoration request.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmittingRestoration(false);
    }
  };

  const handleAdminRestoreAccount = async (ticket: Ticket) => {
    try {
      await customerApi.restoreCustomer(ticket.customerEmail || ticket.customerId);
      const updated = await ticketApi.updateStatus(ticket.id, 'Resolved');
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket(updated);
      }
      await loadTickets();
      setToastMessage('Customer account restored successfully.');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error(err);
      setToastMessage('Failed to restore customer account.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

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
      setInspectCustomer({
        id: `cust-${Date.now()}`,
        name: selectedTicket?.customerName || email,
        email,
        phone: '',
        status: 'Pending',
        subscriptionPlan: 'No active plan',
        mrr: 0,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split('T')[0],
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
        return <Badge variant="warning">OPEN</Badge>;
      case 'In Progress':
        return <Badge variant="brand">IN PROGRESS</Badge>;
      case 'Waiting for Customer':
        return <Badge variant="info">WAITING FOR CUSTOMER</Badge>;
      case 'Resolved':
        return <Badge variant="success">RESOLVED</Badge>;
      case 'Closed':
        return <Badge variant="neutral">CLOSED</Badge>;
      case 'Cancelled':
        return <Badge variant="neutral">CANCELLED</Badge>;
    }
  };

  const hasRestorationTicket = tickets.some(
    (t) => t.category === 'Account Suspension' || t.subject.toLowerCase().includes('restore')
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title={isAdmin ? 'Support Ticket Operations' : 'Help & Support Center'}
        subtitle={
          isAdmin
            ? 'Manage customer inquiries, review restoration requests, assign support engineers, and communicate with customers.'
            : 'Submit support requests, track resolution progress, and chat with technical specialists.'
        }
        icon={Headphones}
      >
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
      </PageHeader>

      {/* DEDICATED SUPPORT SECTION FOR SUSPENDED CUSTOMERS */}
      {isCustomerSuspended && (
        <Card className="p-6 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-950 dark:text-amber-100 shadow-md space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-heading">Request Account Restoration</h2>
              <p className="text-xs text-secondaryText font-medium mt-0.5">
                Your account is currently suspended. Submit a support ticket to request restoration.
              </p>
            </div>
          </div>

          {restorationNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>{restorationNotice}</span>
            </div>
          )}

          <form onSubmit={handleRestorationSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-mutedText uppercase mb-1">Subject</label>
                <input
                  type="text"
                  readOnly
                  value="Request to Restore Suspended Account"
                  className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl font-extrabold text-heading text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mutedText uppercase mb-1">Category</label>
                <input
                  type="text"
                  readOnly
                  value="Account Suspension"
                  className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl font-extrabold text-heading text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-mutedText uppercase mb-1">Message *</label>
              <textarea
                rows={3}
                required
                placeholder="Explain your account restoration request details..."
                value={restorationMessage}
                onChange={(e) => setRestorationMessage(e.target.value)}
                className="w-full p-3 bg-card border border-border rounded-xl text-xs text-primaryText font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-y"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmittingRestoration}
                className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm cursor-pointer"
              >
                Submit Restoration Request
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* RESTORED ACCOUNT BANNER FOR FORMERLY SUSPENDED CUSTOMER */}
      {!isAdmin && !isCustomerSuspended && hasRestorationTicket && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Your account has been restored.</span>
        </div>
      )}

      {/* TICKET DIRECTORY & CHAT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TICKETS LIST */}
        <div className={`lg:col-span-5 space-y-4 ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
          <Card className="p-4 space-y-4">
            {/* Search & Tabs */}
            <SearchInput
              placeholder="Search tickets by ID, subject, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />

            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border no-scrollbar">
              {(['All', 'Open', 'Resolved', 'Cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-secondaryText hover:text-heading hover:bg-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List items */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 divide-y divide-border/60">
              {filteredTickets.length === 0 ? (
                <div className="py-6">
                  <EmptyState
                    icon={MessageSquare}
                    title="No Support Tickets Found"
                    description="Customer support conversations will appear here when tickets are created."
                  />
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  const isSuspensionTicket = t.category === 'Account Suspension' || t.subject.toLowerCase().includes('restore');

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
                          <span className="truncate max-w-[100px]">{t.customerName}</span>
                        </div>
                      </div>

                      {/* Admin Quick Action Controls */}
                      {isAdmin && isSuspensionTicket && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="px-2.5 py-1 bg-secondary text-primary font-extrabold text-[11px] rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                          >
                            Review Request
                          </button>
                          {t.status !== 'Resolved' && (
                            <button
                              onClick={() => handleAdminRestoreAccount(t)}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-[11px] rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              Restore Account
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: CHAT & DETAILS */}
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
                      {(selectedTicket.category === 'Account Suspension' || selectedTicket.subject.toLowerCase().includes('restore')) && selectedTicket.status !== 'Resolved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAdminRestoreAccount(selectedTicket)}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm cursor-pointer"
                        >
                          Restore Account
                        </Button>
                      )}

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

              {/* Dynamic Fields Banner */}
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

              {/* Messages Thread */}
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
            <Card className="h-[680px] flex items-center justify-center p-8 border border-border">
              <EmptyState
                icon={MessageSquare}
                title="No Ticket Selected"
                description="Select a ticket from the left panel to inspect conversation history, respond, or update status."
              />
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

          {category === 'Account Suspension' && (
            <div className="p-3.5 rounded-xl bg-secondary/80 border border-border space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Account Suspension Details</span>
              <Input label="Subject" value="Request to Restore Suspended Account" disabled />
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card z-10">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* ADMIN INSPECT CUSTOMER PROFILE MODAL */}
      {inspectCustomer && (
        <CustomerDetailsModal
          customer={inspectCustomer}
          isOpen={!!inspectCustomer}
          onClose={() => setInspectCustomer(null)}
        />
      )}

      {/* TOAST NOTIFICATION */}
      <Toast
        isVisible={showToast}
        message={toastMessage || ''}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
