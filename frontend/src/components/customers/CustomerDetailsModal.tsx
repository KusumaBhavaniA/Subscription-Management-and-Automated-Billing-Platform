import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Customer, CustomerStatus } from '../../types/customer';
import { customerApi } from '../../services/api/customerApi';
import { ticketApi } from '../../services/api/ticketApi';
import { Ticket } from '../../types/ticket';
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
  ArrowUpRight,
} from 'lucide-react';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onCustomerUpdated?: () => void;
}

type TabType =
  | 'personal'
  | 'account'
  | 'subscription'
  | 'billing'
  | 'payments'
  | 'invoices'
  | 'tickets'
  | 'timeline';

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onCustomerUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [currentCust, setCurrentCust] = useState<Customer | null>(customer);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [assignPlanModalOpen, setAssignPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Pro Business');

  useEffect(() => {
    setCurrentCust(customer);
    if (customer) {
      ticketApi.getTickets().then((allTickets) => {
        setTickets(allTickets.filter((t) => t.customerEmail?.toLowerCase() === customer.email.toLowerCase()));
      });
    }
  }, [customer]);

  if (!currentCust) return null;

  const handleStatusToggle = async (newStatus: CustomerStatus) => {
    setIsActionLoading(true);
    try {
      if (newStatus === 'Suspended') {
        await customerApi.suspendCustomer(currentCust.id, 'Status toggled from modal');
      } else {
        await customerApi.restoreCustomer(currentCust.id);
      }
      const refreshed = await customerApi.getCustomerById(currentCust.id);
      if (refreshed) setCurrentCust(refreshed);
      onCustomerUpdated?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignPlan = async () => {
    setIsActionLoading(true);
    try {
      const mrrMap: Record<string, number> = {
        'Starter Tier': 1999,
        'Pro Business': 4999,
        'Enterprise Scale': 14999,
      };
      const updated = await customerApi.assignPlan(currentCust.id, selectedPlan, mrrMap[selectedPlan] || 2999);
      setCurrentCust(updated);
      setAssignPlanModalOpen(false);
      onCustomerUpdated?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'Active':
      case 'Verified':
        return <Badge variant="success">{status}</Badge>;
      case 'Pending Verification':
      case 'Pending':
        return <Badge variant="warning">{status}</Badge>;
      case 'Suspended':
      case 'Inactive':
        return <Badge variant="error">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 'account', label: 'Account Info', icon: <Shield className="w-4 h-4" /> },
    { id: 'subscription', label: 'Subscription', icon: <Zap className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { id: 'tickets', label: 'Support Tickets', icon: <Headphones className="w-4 h-4" /> },
    { id: 'timeline', label: 'Activity Timeline', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile Details" size="xl">
      <div className="space-y-6">
        {/* Header Header Summary */}
        <div className="p-4 rounded-2xl bg-secondary border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary text-white font-extrabold text-base flex items-center justify-center shadow-md">
              {currentCust.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-heading">{currentCust.name}</h3>
                {getStatusBadge(currentCust.status)}
              </div>
              <p className="text-xs text-secondaryText flex items-center gap-2 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-mutedText" /> {currentCust.email}
                <span className="text-border">•</span>
                <span className="font-mono text-primary font-bold">{currentCust.customerId || currentCust.id}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentCust.status === 'Suspended' ? (
              <Button
                variant="outline"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => handleStatusToggle('Verified')}
                leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              >
                Restore Account
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                isLoading={isActionLoading}
                onClick={() => handleStatusToggle('Suspended')}
                leftIcon={<Ban className="w-3.5 h-3.5" />}
              >
                Suspend
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => setAssignPlanModalOpen(true)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              {currentCust.subscriptionPlan === 'None' || currentCust.subscriptionPlan === 'No Plan' ? 'Assign Plan' : 'Upgrade / Change Plan'}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondaryText hover:text-primaryText hover:bg-secondary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[260px] text-xs">
          {/* PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">Full Name</span>
                <p className="font-bold text-heading text-sm">{currentCust.name}</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">Email Address</span>
                <p className="font-bold text-heading text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> {currentCust.email}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">Phone Number</span>
                <p className="font-bold text-heading text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> {currentCust.phone}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">Country & Address</span>
                <p className="font-bold text-heading text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> {currentCust.country}
                </p>
                <p className="text-secondaryText mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-mutedText" /> {currentCust.address || 'Standard Address On File'}
                </p>
              </div>
            </div>
          )}

          {/* ACCOUNT INFO */}
          {activeTab === 'account' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Customer ID</span>
                <p className="font-mono font-bold text-heading text-sm">{currentCust.customerId || currentCust.id}</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Account Status</span>
                <div>{getStatusBadge(currentCust.status)}</div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase">Joined Date</span>
                <p className="font-bold text-heading flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> {currentCust.joinedDate}
                </p>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider">Active Plan</span>
                  <h4 className="text-lg font-black text-heading mt-0.5">{currentCust.subscriptionPlan}</h4>
                  <p className="text-xs text-secondaryText mt-1">
                    Subscription Status: <span className="font-bold text-primary">{currentCust.subscriptionStatus || (currentCust.subscriptionPlan === 'None' || currentCust.subscriptionPlan === 'No Plan' ? 'Inactive' : 'Active')}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider">Monthly Recurring Revenue</span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{currentCust.mrr.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          {/* BILLING */}
          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <span className="text-[10px] font-bold text-mutedText uppercase">Total Lifetime Spend</span>
                <p className="text-lg font-black text-heading">₹{currentCust.totalSpent.toLocaleString('en-IN')}</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <span className="text-[10px] font-bold text-mutedText uppercase">Default Payment Method</span>
                <p className="font-bold text-heading flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Credit Card (Mastercard ending 8812)
                </p>
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="p-4 rounded-xl border border-border bg-card text-center py-8">
              <DollarSign className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
              <p className="font-bold text-heading">Recent Payment Transactions</p>
              <p className="text-xs text-secondaryText mt-1 max-w-sm mx-auto">
                All auto-debits and manual invoice settlements processed for this customer profile.
              </p>
            </div>
          )}

          {/* INVOICES */}
          {activeTab === 'invoices' && (
            <div className="p-4 rounded-xl border border-border bg-card text-center py-8">
              <FileText className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
              <p className="font-bold text-heading">Customer Invoices</p>
              <p className="text-xs text-secondaryText mt-1">Generate or download tax invoices for this account.</p>
            </div>
          )}

          {/* TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="p-6 text-center border border-border rounded-xl bg-card">
                  <p className="text-xs font-bold text-secondaryText">No support tickets found for this customer.</p>
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{t.id}</span>
                        <Badge variant={t.status === 'Resolved' ? 'success' : 'warning'}>{t.status}</Badge>
                      </div>
                      <p className="font-bold text-heading mt-1">{t.subject}</p>
                    </div>
                    <span className="text-[10px] text-mutedText">{t.category}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 p-4 border border-border rounded-xl bg-card">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-bold text-heading">Customer Account Created</p>
                  <p className="text-[10px] text-mutedText">{currentCust.joinedDate}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Assign Plan Modal */}
      {assignPlanModalOpen && (
        <Modal isOpen={assignPlanModalOpen} onClose={() => setAssignPlanModalOpen(false)} title="Assign Subscription Plan" size="sm">
          <div className="space-y-4">
            <p className="text-xs text-secondaryText">Select a plan to assign or upgrade for {currentCust.name}:</p>
            <div className="space-y-2">
              {['Starter Tier', 'Pro Business', 'Enterprise Scale'].map((plan) => (
                <label
                  key={plan}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                    selectedPlan === plan ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card'
                  }`}
                >
                  <span className="text-xs text-heading">{plan}</span>
                  <input
                    type="radio"
                    name="planSelect"
                    checked={selectedPlan === plan}
                    onChange={() => setSelectedPlan(plan)}
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setAssignPlanModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isActionLoading} onClick={handleAssignPlan}>Confirm Assignment</Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
