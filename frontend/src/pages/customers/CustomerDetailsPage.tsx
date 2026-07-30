import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Shield,
  CreditCard,
  FileText,
  Clock,
  Ban,
  CheckCircle,
  Zap,
  DollarSign,
  Headphones,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  ArrowLeft,
  Trash2,
  TrendingUp,
  TrendingDown,
  Lock,
  MailCheck,
  LogIn,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Customer, CustomerStatus } from '../../types/customer';
import { customerApi } from '../../services/api/customerApi';
import { ticketApi } from '../../services/api/ticketApi';
import { Ticket } from '../../types/ticket';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, setItem, STORAGE_KEYS } from '../../utils/storage';

type TabType =
  | 'overview'
  | 'subscription'
  | 'billing'
  | 'invoices'
  | 'payments'
  | 'tickets'
  | 'timeline';

export const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Pro Business');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadCustomer = async () => {
    setIsLoading(true);
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      const cust = await customerApi.getCustomerById(id);
      if (cust) {
        setCustomer(cust);
        const allTickets = await ticketApi.getTickets();
        setTickets(allTickets.filter((t) => t.customerEmail?.toLowerCase() === cust.email.toLowerCase()));
      } else {
        // Fallback for demonstration if ID direct access
        const fallbackCust: Customer = {
          id: id,
          customerId: id.startsWith('CUS-') ? id : `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          name: 'Rohan Sharma',
          firstName: 'Rohan',
          lastName: 'Sharma',
          email: 'rohan.sharma@techcorp.in',
          phone: '+91 9876543210',
          status: 'Verified',
          subscriptionPlan: 'Pro Business',
          subscriptionStatus: 'Active',
          mrr: 4999,
          totalSpent: 59988,
          joinedDate: '2025-11-15',
          country: 'India',
          address: '102 Tech Park, Outer Ring Road, Bangalore, KA',
        };
        setCustomer(fallbackCust);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-xs text-secondaryText mt-3 font-semibold">Loading Customer Profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
        <h2 className="text-lg font-bold text-heading">Customer Not Found</h2>
        <p className="text-xs text-secondaryText">The requested customer record does not exist or was soft-deleted.</p>
        <Button variant="primary" onClick={() => navigate('/admin/customers')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: CustomerStatus) => {
    setIsActionLoading(true);
    try {
      const updated = await customerApi.updateCustomerStatus(customer.id, newStatus);
      setCustomer(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignPlan = async (planName: string, mrrVal: number) => {
    setIsActionLoading(true);
    try {
      const updated = await customerApi.assignPlan(customer.id, planName, mrrVal);
      setCustomer(updated);
      setIsAssignModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    setIsActionLoading(true);
    try {
      const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
      const filtered = list.filter((c) => c.id !== customer.id && c.customerId !== customer.customerId);
      setItem(STORAGE_KEYS.CUSTOMERS, filtered);
      setIsDeleteModalOpen(false);
      navigate('/admin/customers');
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getAccountBadge = (st: CustomerStatus) => {
    switch (st) {
      case 'Verified':
      case 'Active':
        return <Badge variant="success">{st}</Badge>;
      case 'Pending Verification':
      case 'Pending':
        return <Badge variant="warning">{st}</Badge>;
      case 'Suspended':
      case 'Inactive':
        return <Badge variant="danger">{st}</Badge>;
      default:
        return <Badge variant="neutral">{st}</Badge>;
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview & Info', icon: <User className="w-4 h-4" /> },
    { id: 'subscription', label: 'Subscription & Plan', icon: <Zap className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing History', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'tickets', label: 'Support Tickets', icon: <Headphones className="w-4 h-4" /> },
    { id: 'timeline', label: 'Activity Timeline', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-xs font-bold text-secondaryText hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Directory
        </Link>
        <span className="font-mono text-xs text-mutedText">ID: {customer.customerId || customer.id}</span>
      </div>

      {/* Main Profile Summary Banner */}
      <Card className="p-6 bg-card border border-border space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
              {customer.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-heading">{customer.name}</h1>
                {getAccountBadge(customer.status)}
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <MailCheck className="w-3 h-3" /> Email Verified
                </span>
              </div>
              <p className="text-xs text-secondaryText flex flex-wrap items-center gap-3 mt-1 font-medium">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> {customer.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> {customer.phone}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-primary" /> {customer.country}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
            <div className="text-right">
              <span className="text-mutedText font-semibold uppercase text-[10px] block">Current Plan</span>
              <span className="font-extrabold text-heading text-sm">{customer.subscriptionPlan}</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <span className="text-mutedText font-semibold uppercase text-[10px] block">Monthly MRR</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(customer.mrr)}</span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS TOOLBAR */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              Assign Plan
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
              onClick={() => handleAssignPlan('Enterprise Scale', 14999)}
            >
              Upgrade
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
              onClick={() => handleAssignPlan('Starter Tier', 1999)}
            >
              Downgrade
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5 text-primary" />}
              onClick={() => setActiveTab('billing')}
            >
              View Billing History
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<DollarSign className="w-3.5 h-3.5 text-success" />}
              onClick={() => setActiveTab('payments')}
            >
              View Payments
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {customer.status === 'Suspended' ? (
              <Button
                variant="outline"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => handleStatusChange('Verified')}
                leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              >
                Restore Account
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => handleStatusChange('Suspended')}
                leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
              >
                Suspend
              </Button>
            )}

            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Soft Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondaryText hover:text-primaryText hover:bg-secondary'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* OVERVIEW & INFO */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-heading pb-2 border-b border-border flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Personal Information
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">Full Name</span>
                  <span className="font-bold text-heading">{customer.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">First Name</span>
                  <span className="font-bold text-heading">{customer.firstName || customer.name.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">Last Name</span>
                  <span className="font-bold text-heading">{customer.lastName || customer.name.split(' ').slice(1).join(' ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">Country</span>
                  <span className="font-bold text-heading">{customer.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mutedText font-semibold">Address</span>
                  <span className="font-medium text-secondaryText text-right max-w-xs">{customer.address || 'Standard Address On File'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-heading pb-2 border-b border-border flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Contact & Account Status
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">Email Address</span>
                  <span className="font-bold text-heading">{customer.email}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">Phone Number</span>
                  <span className="font-bold text-heading">{customer.phone}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">Account Status</span>
                  <div>{getAccountBadge(customer.status)}</div>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-mutedText font-semibold">Email Verification</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <MailCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mutedText font-semibold">Last Portal Login</span>
                  <span className="font-bold text-heading flex items-center gap-1">
                    <LogIn className="w-3.5 h-3.5 text-primary" /> Today at 18:45 IST
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* SUBSCRIPTION & PLAN */}
        {activeTab === 'subscription' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-heading">Subscription Tier & Revenue</h3>
                <p className="text-xs text-secondaryText mt-0.5">Active plan allocations and recurring MRR stats.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                Change Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-secondary space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Current Plan</span>
                <p className="text-base font-black text-heading">{customer.subscriptionPlan}</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Subscription Status</span>
                <p className="text-base font-bold text-primary">{customer.subscriptionStatus || (customer.subscriptionPlan === 'None' ? 'Inactive' : 'Active')}</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Monthly MRR Contribution</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(customer.mrr)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* BILLING HISTORY */}
        {activeTab === 'billing' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-heading">Billing Account Overview</h3>
                <p className="text-xs text-secondaryText mt-0.5">Lifetime spend, billing address, and payment terms.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-secondary space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Total Lifetime Spend</span>
                <p className="text-base font-black text-heading">{formatCurrency(customer.totalSpent)}</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Billing Cycle</span>
                <p className="text-base font-bold text-heading">Monthly Auto-Renewal</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Payment Method</span>
                <p className="text-base font-bold text-primary flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Visa ending in 4242
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* INVOICES */}
        {activeTab === 'invoices' && (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-heading pb-2 border-b border-border">Generated Invoices</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                    <th className="p-3 font-semibold">Invoice Number</th>
                    <th className="p-3 font-semibold">Issue Date</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-tableHover">
                    <td className="p-3 font-mono font-bold text-primary">INV-2026-002</td>
                    <td className="p-3 text-secondaryText">05 July 2026</td>
                    <td className="p-3 font-bold text-heading">{formatCurrency(customer.mrr || 4999)}</td>
                    <td className="p-3"><Badge variant="success">Paid</Badge></td>
                  </tr>
                  <tr className="hover:bg-tableHover">
                    <td className="p-3 font-mono font-bold text-primary">INV-2026-001</td>
                    <td className="p-3 text-secondaryText">05 June 2026</td>
                    <td className="p-3 font-bold text-heading">{formatCurrency(customer.mrr || 4999)}</td>
                    <td className="p-3"><Badge variant="success">Paid</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* PAYMENTS */}
        {activeTab === 'payments' && (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-heading pb-2 border-b border-border">Payment Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                    <th className="p-3 font-semibold">Transaction ID</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Method</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-tableHover">
                    <td className="p-3 font-mono font-bold text-primary">TXN-98712399</td>
                    <td className="p-3 text-secondaryText">05 July 2026, 14:30</td>
                    <td className="p-3 font-semibold text-primaryText">Credit Card (Visa)</td>
                    <td className="p-3 font-bold text-heading">{formatCurrency(customer.mrr || 4999)}</td>
                    <td className="p-3"><Badge variant="success">Successful</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-heading pb-2 border-b border-border">Customer Support Tickets</h3>
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-xs font-medium text-mutedText">
                  No active or historical support tickets found for this customer.
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-border bg-secondary flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-primary">{t.id}</span>
                        <Badge variant={t.status === 'Resolved' ? 'success' : 'warning'}>{t.status}</Badge>
                      </div>
                      <h4 className="text-xs font-bold text-heading mt-1">{t.subject}</h4>
                      <p className="text-[10px] text-mutedText mt-0.5">{t.category} ({t.subcategory})</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/customer/support')}>
                      Open Thread
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* ACTIVITY TIMELINE */}
        {activeTab === 'timeline' && (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-heading pb-2 border-b border-border">Activity & Event Log</h3>
            <div className="space-y-4 border-l-2 border-primary/30 pl-4 ml-2 text-xs">
              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />
                <p className="font-bold text-heading">Customer Logged In</p>
                <p className="text-[10px] text-mutedText">Today at 18:45 IST via Web Portal</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-card" />
                <p className="font-bold text-heading">Payment Received (INV-2026-002)</p>
                <p className="text-[10px] text-mutedText">05 July 2026, 14:30 IST</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-card" />
                <p className="font-bold text-heading">Email Address Verified</p>
                <p className="text-[10px] text-mutedText">28 July 2026 via OTP Verification</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-card" />
                <p className="font-bold text-heading">Customer Registered</p>
                <p className="text-[10px] text-mutedText">{customer.joinedDate}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Assign Plan Modal */}
      {isAssignModalOpen && (
        <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Subscription Plan" size="sm">
          <div className="space-y-4">
            <p className="text-xs text-secondaryText">Select a plan tier to assign to {customer.name}:</p>
            <div className="space-y-2">
              {[
                { name: 'Starter Tier', mrr: 1999 },
                { name: 'Pro Business', mrr: 4999 },
                { name: 'Enterprise Scale', mrr: 14999 },
              ].map((p) => (
                <label
                  key={p.name}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                    selectedPlan === p.name ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card'
                  }`}
                >
                  <span className="text-xs text-heading">{p.name}</span>
                  <span className="text-xs font-bold text-emerald-600">₹{p.mrr.toLocaleString('en-IN')}/mo</span>
                  <input
                    type="radio"
                    name="planSelect"
                    checked={selectedPlan === p.name}
                    onChange={() => setSelectedPlan(p.name)}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isActionLoading} onClick={() => handleAssignPlan(selectedPlan, selectedPlan === 'Starter Tier' ? 1999 : selectedPlan === 'Pro Business' ? 4999 : 14999)}>Confirm Plan</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Soft Delete Modal */}
      {isDeleteModalOpen && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Soft Delete Customer Profile" size="sm">
          <div className="space-y-4">
            <p className="text-xs text-secondaryText">
              Are you sure you want to soft delete the customer profile for <strong className="text-heading">{customer.name}</strong>? The record will be archived from active directory views.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" isLoading={isActionLoading} onClick={handleSoftDelete}>Confirm Soft Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
