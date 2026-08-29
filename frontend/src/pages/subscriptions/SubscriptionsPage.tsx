import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  XCircle,
  RefreshCw,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { Toast } from '../../components/common/Toast';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchInput } from '../../components/common/SearchInput';
import { Avatar } from '../../components/common/Avatar';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Subscription, SubscriptionStatus, BillingCycle } from '../../types/subscription';
import { subscriptionManagementApi } from '../../services/api/subscriptionManagementApi';
import { customerApi } from '../../services/api/customerApi';
import { Customer } from '../../types/customer';
import { useAuth } from '../../hooks/useAuth';

import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { SuspendedActionModal } from '../../components/common/SuspendedActionModal';

export const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Admin';
  const isSuspended = !isAdmin && (user?.accountStatus === 'SUSPENDED' || user?.status === 'Suspended');
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Assign Modal (Admin only)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCustEmail, setSelectedCustEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Pro Business');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('Monthly');

  // Custom Cancel Subscription Modal
  const [cancelTargetSub, setCancelTargetSub] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('Too Expensive');
  const [customReasonDetails, setCustomReasonDetails] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Upgrade Modal State
  const [upgradeTargetSub, setUpgradeTargetSub] = useState<Subscription | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Downgrade Modal State
  const [downgradeTargetSub, setDowngradeTargetSub] = useState<Subscription | null>(null);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const loadData = async () => {
    if (isAdmin) {
      const list = await subscriptionManagementApi.getSubscriptions();
      setSubscriptions(list);
      const custs = await customerApi.getCustomers();
      setCustomers(custs);
      if (custs.length > 0 && !selectedCustEmail) {
        setSelectedCustEmail(custs[0].email);
      }
    } else {
      const mySub = await subscriptionManagementApi.getMySubscription();
      setSubscriptions(mySub ? [mySub] : []);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustEmail) return;

    setIsLoading(true);
    try {
      const cust = customers.find((c) => c.email === selectedCustEmail);
      await subscriptionManagementApi.assignSubscription(
        selectedCustEmail,
        cust?.name || selectedCustEmail,
        selectedPlan,
        selectedCycle
      );
      await loadData();
      setIsAssignModalOpen(false);
      setToastMessage(`Successfully assigned ${selectedPlan} to ${selectedCustEmail}`);
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error(err);
      setToastMessage('Failed to assign subscription.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUpgradeModal = (sub: Subscription) => {
    if (isSuspended) {
      setIsSuspendedModalOpen(true);
      return;
    }
    navigate('/customer/plans?change=upgrade');
  };

  const handleOpenDowngradeModal = (sub: Subscription) => {
    if (isSuspended) {
      setIsSuspendedModalOpen(true);
      return;
    }
    navigate('/customer/plans?change=downgrade');
  };

  const handleConfirmDowngrade = async () => {
    if (!downgradeTargetSub) return;
    setIsDowngrading(true);
    try {
      await subscriptionManagementApi.downgradeSubscription(downgradeTargetSub.id, 'Starter Tier');
      await loadData();
      setDowngradeTargetSub(null);
      setToastMessage('Subscription downgraded to Starter Tier.');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error(err);
      setToastMessage('Downgrade failed.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsDowngrading(false);
    }
  };

  const handleOpenCancelModal = (sub: Subscription) => {
    if (isSuspended) {
      setIsSuspendedModalOpen(true);
      return;
    }
    setCancelTargetSub(sub);
    setCancelReason('Too Expensive');
    setCustomReasonDetails('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetSub) return;
    setIsCancelling(true);
    try {
      const res = await subscriptionManagementApi.cancelSubscription(cancelTargetSub.id);
      await loadData();
      setCancelTargetSub(null);

      setToastMessage(`Your subscription has been cancelled. Prorated refund of ${formatCurrency(res.refundAmount)} processed.`);
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error(err);
      setToastMessage(err.message || 'Failed to cancel subscription.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRenew = async (sub: Subscription) => {
    if (isSuspended) {
      setIsSuspendedModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      await subscriptionManagementApi.renewSubscription(sub.id);
      await loadData();
      setToastMessage('Subscription renewed successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      console.error(err);
      setToastMessage('Renewal failed.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const displaySubs = subscriptions.filter((s) => {
    const matchesRole = isAdmin || s.customerEmail.toLowerCase() === user?.email.toLowerCase();
    const matchesSearch =
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.planName.toLowerCase().includes(search.toLowerCase()) ||
      s.customerEmail.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getStatusBadge = (sub: Subscription) => {
    if (sub.cancelAtPeriodEnd || (sub as any).cancel_at_period_end) {
      return <Badge variant="warning">Cancellation Scheduled</Badge>;
    }
    switch (sub.status) {
      case 'Active':
        return <Badge variant="success">Active</Badge>;
      case 'Inactive':
        return <Badge variant="neutral">Inactive</Badge>;
      case 'Expired':
        return <Badge variant="warning">Expired</Badge>;
      case 'Cancelled':
      case 'canceled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        title={isAdmin ? 'Subscription Lifecycle Operations' : 'My Active Subscription'}
        subtitle="Independent SaaS subscription management. Assign plans, upgrade/downgrade tiers, cancel, or renew subscriptions."
        icon={CreditCard}
      >
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAssignModalOpen(true)}
          >
            Assign Subscription
          </Button>
        )}
      </PageHeader>

      {/* SUSPENSION WARNING BANNER */}
      {isSuspended && (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold">
              Subscription actions are unavailable while your account is suspended. Your account is currently suspended. Subscription purchases and payments are disabled. Please contact Support to request restoration.
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/customer/support')}
            className="bg-amber-600 hover:bg-amber-700 text-white border-none shrink-0"
          >
            Contact Support
          </Button>
        </div>
      )}

      {/* Search & Counter */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md w-full">
          <SearchInput
            placeholder="Search subscriptions by subscriber or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
        <div className="text-xs text-secondaryText font-medium">
          Showing <span className="text-heading font-extrabold">{displaySubs.length}</span> subscriptions
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="p-0 overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText text-[11px] uppercase tracking-wider bg-tableHeader">
                <th className="py-3 px-4 font-bold">Subscriber</th>
                <th className="py-3 px-4 font-bold">Allocated Plan</th>
                <th className="py-3 px-4 font-bold">Billing Frequency</th>
                <th className="py-3 px-4 font-bold text-right">Price / MRR</th>
                <th className="py-3 px-4 font-bold text-center">Subscription Status</th>
                <th className="py-3 px-4 font-bold">Next Renewal</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displaySubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={CreditCard}
                      title="No Subscriptions Found"
                      description={
                        isAdmin
                          ? 'No subscription records match your search query.'
                          : 'No active or historical subscriptions found for your account.'
                      }
                      actionLabel={isAdmin ? 'Assign Subscription' : 'Browse Plans'}
                      onAction={
                        isAdmin
                          ? () => setIsAssignModalOpen(true)
                          : () => navigate('/customer/plans')
                      }
                    />
                  </td>
                </tr>
              ) : (
                displaySubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-tableHover transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={sub.customerName} size="sm" />
                        <div>
                          <span className="font-bold text-heading block">{sub.customerName}</span>
                          <span className="text-[10px] text-mutedText font-mono">{sub.customerEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-heading">
                      <span className="px-2 py-0.5 rounded-lg bg-secondary text-primary font-semibold text-[11px]">
                        {sub.planName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondaryText font-medium">{sub.billingCycle}</td>
                    <td className="py-3 px-4 font-black text-right text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(sub.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(sub)}</td>
                    <td className="py-3 px-4 text-mutedText">{formatDate(sub.nextBillingDate)}</td>

                    {/* Actions Toolbar */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {sub.status === 'Active' ? (
                          <>
                            <button
                              onClick={() => handleOpenUpgradeModal(sub)}
                              className="px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-emerald-600 dark:text-emerald-400 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Upgrade Plan"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>Upgrade</span>
                            </button>

                            <button
                              onClick={() => handleOpenDowngradeModal(sub)}
                              className="px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-amber-600 dark:text-amber-400 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Downgrade Plan"
                            >
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>Downgrade</span>
                            </button>

                            <button
                              onClick={() => handleOpenCancelModal(sub)}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Cancel Subscription"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRenew(sub)}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                            title="Renew Subscription"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Renew</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ASSIGN SUBSCRIPTION MODAL (ADMIN) */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Subscription to Customer"
        size="md"
      >
        <form onSubmit={handleAssign} className="space-y-4 text-xs">
          <Select
            label="Select Customer Profile *"
            value={selectedCustEmail}
            onChange={(e) => setSelectedCustEmail(e.target.value)}
            options={customers.map((c) => ({
              value: c.email,
              label: `${c.name} (${c.email}) - Current: ${c.subscriptionPlan}`,
            }))}
          />

          <Select
            label="Select Subscription Plan Tier *"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            options={[
              { value: 'Starter Tier', label: 'Starter Tier (₹1,999/mo)' },
              { value: 'Pro Business', label: 'Pro Business (₹4,999/mo)' },
              { value: 'Enterprise Scale', label: 'Enterprise Scale (₹14,999/mo)' },
            ]}
          />

          <Select
            label="Billing Frequency *"
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value as BillingCycle)}
            options={[
              { value: 'Monthly', label: 'Monthly Auto-Billing' },
              { value: 'Quarterly', label: 'Quarterly Auto-Billing (Save 10%)' },
              { value: 'Yearly', label: 'Yearly Auto-Billing (Save 20%)' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsAssignModalOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<Zap className="w-4 h-4" />}>
              Assign Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* CUSTOM CANCELLATION CONFIRMATION MODAL (NO WINDOW.CONFIRM) */}
      {cancelTargetSub && (
        <Modal
          isOpen={!!cancelTargetSub}
          onClose={() => setCancelTargetSub(null)}
          size="lg"
        >
          <div className="space-y-5 text-xs p-1">
            {/* Header Area with Warning Icon */}
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-heading">Cancel Subscription</h3>
                <p className="text-xs text-secondaryText leading-relaxed">
                  Are you sure you want to cancel your subscription? Cancelling your subscription will stop future renewals. You will continue to have access to your current plan until the end of your billing period.
                </p>
                <p className="text-[11px] text-mutedText italic pt-1">
                  If you change your mind before the expiry date, you may renew or reactivate your subscription anytime.
                </p>
              </div>
            </div>

            {/* Subscription Details Card */}
            <div className="p-4 rounded-xl bg-secondary border border-border space-y-3">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Target Subscription Details</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-mutedText font-semibold block text-[10px]">Plan Name</span>
                  <span className="font-extrabold text-heading">{cancelTargetSub.planName}</span>
                </div>
                <div>
                  <span className="text-mutedText font-semibold block text-[10px]">Current Status</span>
                  {getStatusBadge(cancelTargetSub)}
                </div>
                <div>
                  <span className="text-mutedText font-semibold block text-[10px]">Billing Cycle</span>
                  <span className="font-bold text-heading">{cancelTargetSub.billingCycle}</span>
                </div>
                <div>
                  <span className="text-mutedText font-semibold block text-[10px]">Current Price</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(cancelTargetSub.amount)}</span>
                </div>
              </div>
            </div>

            {/* Optional Cancellation Reason */}
            <div className="space-y-3 pt-2 border-t border-border">
              <Select
                label="Reason for Cancellation (Optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                options={[
                  { value: 'Too Expensive', label: 'Too Expensive' },
                  { value: 'Switching to Another Service', label: 'Switching to Another Service' },
                  { value: 'No Longer Needed', label: 'No Longer Needed' },
                  { value: 'Missing Features', label: 'Missing Features' },
                  { value: 'Technical Issues', label: 'Technical Issues' },
                  { value: 'Other', label: 'Other' },
                ]}
              />

              {cancelReason === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-secondaryText mb-1.5 uppercase tracking-wider">
                    Please Specify Reason
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us how we can improve our services..."
                    value={customReasonDetails}
                    onChange={(e) => setCustomReasonDetails(e.target.value)}
                    className="w-full p-3 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 font-medium resize-y"
                  />
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                type="button"
                onClick={() => setCancelTargetSub(null)}
                disabled={isCancelling}
              >
                Keep Subscription
              </Button>
              <Button
                variant="danger"
                type="button"
                isLoading={isCancelling}
                onClick={handleConfirmCancel}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* TOAST NOTIFICATION */}
      <Toast
        isVisible={showToast}
        message={toastMessage || ''}
        type={toastType}
        onClose={() => setShowToast(false)}
      />

      <SuspendedActionModal
        isOpen={isSuspendedModalOpen}
        onClose={() => setIsSuspendedModalOpen(false)}
      />
    </div>
  );
};
