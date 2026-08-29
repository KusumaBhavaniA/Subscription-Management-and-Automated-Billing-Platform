import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Check,
  Zap,
  Search,
  Users,
  HardDrive,
  Code2,
  Headphones,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { formatCurrency } from '../../utils/formatters';
import { Plan } from '../../types/plan';
import { Subscription } from '../../types/subscription';
import { planApi } from '../../services/api/planApi';
import { subscriptionManagementApi } from '../../services/api/subscriptionManagementApi';
import { useAuth } from '../../hooks/useAuth';

import { SuspendedActionModal } from '../../components/common/SuspendedActionModal';

type SortOption = 'popular' | 'price-asc' | 'price-desc';

export const CustomerPlansPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuspended = user?.accountStatus === 'SUSPENDED' || user?.status === 'Suspended';
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  // Review & Purchase Modal
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [checkoutCycle, setCheckoutCycle] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allPlans = await planApi.getPlans();
      // Only display plans enabled by Admin
      const enabledPlans = allPlans.filter((p) => p.isEnabled !== false);
      setPlans(enabledPlans);

      if (user?.email) {
        const sub = await subscriptionManagementApi.getSubscriptionByEmail(user.email);
        setActiveSub(sub);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getPlanPriceForCycle = (plan: Plan, cycle: 'Monthly' | 'Quarterly' | 'Yearly') => {
    if (cycle === 'Monthly') return plan.priceMonthly;
    if (cycle === 'Quarterly') return plan.priceQuarterly || Math.round(plan.priceMonthly * 3 * 0.9);
    return plan.priceYearly;
  };

  // Filter & Sort Logic
  const filteredPlans = plans
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      }
      const priceA = getPlanPriceForCycle(a, billingCycle);
      const priceB = getPlanPriceForCycle(b, billingCycle);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return 0;
    });

  const getPlanTierLevel = (planName: string) => {
    if (planName === 'Starter Tier') return 1;
    if (planName === 'Pro Business') return 2;
    if (planName === 'Enterprise Scale') return 3;
    return 1;
  };

  const getActionButtonText = (targetPlan: Plan, currentCycle: 'Monthly' | 'Quarterly' | 'Yearly') => {
    if (isSuspended) {
      return { text: 'Subscription Actions Unavailable', variant: 'outline' as const, disabled: false, isCurrent: false };
    }

    if (!activeSub || activeSub.planName === 'None' || !activeSub.status) {
      return { text: 'Subscribe', variant: 'primary' as const, disabled: false, isCurrent: false };
    }

    if (activeSub.status === 'Cancelled') {
      return { text: 'Subscribe Again', variant: 'primary' as const, disabled: false, isCurrent: false };
    }

    if (activeSub.status === 'Expired') {
      return { text: 'Renew', variant: 'primary' as const, disabled: false, isCurrent: false };
    }

    // Active Subscription matching
    const isPlanMatch = activeSub.planName === targetPlan.name || (activeSub as any).planId === targetPlan.id;
    const isCycleMatch = activeSub.billingCycle === currentCycle;

    if (isPlanMatch) {
      if (isCycleMatch) {
        return { text: 'Current Active Plan', variant: 'outline' as const, disabled: true, isCurrent: true };
      } else {
        return { text: `Upgrade to ${currentCycle}`, variant: 'primary' as const, disabled: false, isCurrent: false };
      }
    }

    const currentLevel = getPlanTierLevel(activeSub.planName);
    const targetLevel = getPlanTierLevel(targetPlan.name);

    if (targetLevel > currentLevel) {
      return { text: `Upgrade to ${targetPlan.name}`, variant: 'primary' as const, disabled: false, isCurrent: false };
    } else {
      return { text: `Downgrade to ${targetPlan.name}`, variant: 'outline' as const, disabled: false, isCurrent: false };
    }
  };

  const handleOpenCheckout = (plan: Plan) => {
    if (isSuspended) {
      setIsSuspendedModalOpen(true);
      return;
    }
    setSelectedPlanForCheckout(plan);
    setCheckoutCycle(billingCycle);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedPlanForCheckout) return;
    const targetPrice = getPlanPriceForCycle(selectedPlanForCheckout, checkoutCycle);
    const currentPrice = (activeSub && activeSub.status === 'Active') ? (activeSub.amount || 0) : 0;
    const isUpgrade = !!(activeSub && activeSub.status === 'Active' && targetPrice > currentPrice);
    const isDowngrade = !!(activeSub && activeSub.status === 'Active' && targetPrice < currentPrice);
    const unusedValue = (activeSub && activeSub.status === 'Active') ? currentPrice : 0;
    const netAdjustment = (activeSub && activeSub.status === 'Active') ? Math.max(0, targetPrice - currentPrice) : targetPrice;
    const gst = Math.round(netAdjustment * 0.10);
    const total = netAdjustment + gst;

    const calculation = {
      newSubscriptionValue: targetPrice,
      unusedValue,
      adjustment: netAdjustment,
      gst,
      totalPayable: total,
      isUpgrade,
      isDowngrade,
      currentPlanName: activeSub?.planName || null,
      targetPlanName: selectedPlanForCheckout.name,
      billingCycle: checkoutCycle,
    };

    setIsCheckoutModalOpen(false);
    navigate('/customer/payment', {
      state: {
        plan: selectedPlanForCheckout,
        billingCycle: checkoutCycle,
        calculation,
      },
    });
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Success Toast */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-5 h-5" /> {successMessage}
          </span>
          <span className="text-[10px] opacity-80">Redirecting to Dashboard...</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Available Subscription Tiers
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Choose the right plan for your business needs. Live pricing synchronized with backend configurations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Monthly / Quarterly / Yearly Billing Toggle */}
          <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setBillingCycle('Monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'Monthly' ? 'bg-primary text-white shadow-sm' : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('Quarterly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'Quarterly' ? 'bg-primary text-white shadow-sm' : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Quarterly <span className="text-[10px] text-emerald-500 font-semibold">(Save 10%)</span>
            </button>
            <button
              onClick={() => setBillingCycle('Yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'Yearly' ? 'bg-primary text-white shadow-sm' : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Yearly <span className="text-[10px] text-success font-semibold">(Save 20%)</span>
            </button>
          </div>
        </div>
      </div>

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

      {/* Search, Filter & Sort Controls Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
          <input
            type="text"
            placeholder="Search plans by name or feature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            options={[
              { value: 'popular', label: 'Sort by: Most Popular' },
              { value: 'price-asc', label: 'Sort by: Price (Low to High)' },
              { value: 'price-desc', label: 'Sort by: Price (High to Low)' },
            ]}
          />
        </div>
      </Card>

      {/* Plans List Grid */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-xs text-secondaryText mt-3 font-semibold">Loading available plans from backend...</p>
        </Card>
      ) : filteredPlans.length === 0 ? (
        /* FRIENDLY EMPTY STATE WHEN NO PLANS ARE AVAILABLE */
        <Card className="p-12 text-center space-y-4 border border-dashed border-border bg-card">
          <AlertCircle className="w-12 h-12 text-mutedText mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-heading">No subscription plans are available at the moment.</h3>
            <p className="text-xs text-secondaryText max-w-md mx-auto">
              The administrator has not published any active subscription tiers. Please check back later or contact support.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/customer/support')}>
            Contact Support
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const price = getPlanPriceForCycle(plan, billingCycle);
            const priceSuffix = billingCycle === 'Monthly' ? '/mo' : billingCycle === 'Quarterly' ? '/quarter' : '/yr';
            const actionInfo = getActionButtonText(plan, billingCycle);
            const isCurrent = actionInfo.isCurrent;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 transition-all border ${
                  isCurrent
                    ? 'border-primary shadow-xl ring-2 ring-primary/30 bg-primary/5'
                    : plan.isPopular
                    ? 'border-primary/60 shadow-md ring-1 ring-primary/20 bg-card'
                    : 'border-border bg-card'
                }`}
              >
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {isCurrent ? (
                    <Badge variant="success">Current Plan</Badge>
                  ) : plan.isPopular ? (
                    <Badge variant="brand">Most Popular</Badge>
                  ) : (
                    <span />
                  )}
                </div>

                <div className="space-y-4">
                  {/* Name & Description */}
                  <div>
                    <h3 className="text-lg font-extrabold text-heading">{plan.name}</h3>
                    <p className="text-xs text-secondaryText mt-1 min-h-[36px] font-medium leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Section */}
                  <div className="pt-3 border-t border-border space-y-1">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-heading">{formatCurrency(price)}</span>
                        <span className="text-xs text-mutedText font-semibold">{priceSuffix}</span>
                      </div>
                      {billingCycle === 'Quarterly' && (
                        <Badge variant="success" size="sm">Save 10%</Badge>
                      )}
                      {billingCycle === 'Yearly' && (
                        <Badge variant="success" size="sm">Save 20%</Badge>
                      )}
                    </div>
                  </div>

                  {/* Usage Limits */}
                  <div className="space-y-2 pt-3 border-t border-border text-xs">
                    <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Usage Limits</span>

                    <div className="flex items-center gap-2 text-secondaryText font-semibold">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Max Customers: <strong className="text-heading">{plan.maxCustomers || '1,000 Customers'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-secondaryText font-semibold">
                      <HardDrive className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Storage: <strong className="text-heading">{plan.storage || '50 GB Storage'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-secondaryText font-semibold">
                      <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>API Access: <strong className="text-heading">{plan.apiAccess || 'Standard REST API'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-secondaryText font-semibold">
                      <Headphones className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Support: <strong className="text-heading">{plan.supportLevel || '24/7 Support'}</strong></span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Included Features</span>
                    <ul className="space-y-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-primaryText font-medium">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Action Button */}
                <div className="pt-6 mt-4 border-t border-border">
                  <Button
                    variant={actionInfo.variant}
                    disabled={actionInfo.disabled}
                    className="w-full"
                    onClick={() => handleOpenCheckout(plan)}
                    rightIcon={!actionInfo.disabled ? <ArrowRight className="w-4 h-4" /> : undefined}
                  >
                    {actionInfo.text}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* REVIEW SUBSCRIPTION & PURCHASE MODAL */}
      {selectedPlanForCheckout && (
        <Modal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          title="Review & Confirm Subscription"
          size="md"
        >
          <div className="space-y-5 text-xs">
            {/* CURRENT SUBSCRIPTION SECTION */}
            {activeSub && activeSub.status === 'Active' && (
              <div className="p-3.5 rounded-xl bg-secondary border border-border space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Current Subscription</span>
                <div className="flex justify-between font-bold text-heading">
                  <span>{activeSub.planName} ({activeSub.billingCycle || 'Monthly'})</span>
                  <span>{formatCurrency(activeSub.amount || 0)}</span>
                </div>
              </div>
            )}

            {/* NEW SUBSCRIPTION SECTION */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">New Subscription</span>
              <div className="flex justify-between font-extrabold text-heading">
                <span>{selectedPlanForCheckout.name} ({checkoutCycle})</span>
                <span className="text-primary">{formatCurrency(getPlanPriceForCycle(selectedPlanForCheckout, checkoutCycle))}</span>
              </div>
            </div>

            {/* Cycle Selector in Checkout */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider">Billing Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutCycle('Monthly')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    checkoutCycle === 'Monthly' ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card'
                  }`}
                >
                  <span className="block font-bold text-heading text-xs">Monthly</span>
                  <span className="text-[11px] text-emerald-600 font-extrabold">
                    {formatCurrency(selectedPlanForCheckout.priceMonthly)}/mo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutCycle('Quarterly')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    checkoutCycle === 'Quarterly' ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card'
                  }`}
                >
                  <span className="block font-bold text-heading text-xs">Quarterly <span className="text-[9px] text-emerald-600">(Save 10%)</span></span>
                  <span className="text-[11px] text-emerald-600 font-extrabold">
                    {formatCurrency(selectedPlanForCheckout.priceQuarterly || Math.round(selectedPlanForCheckout.priceMonthly * 3 * 0.9))}/qtr
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutCycle('Yearly')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    checkoutCycle === 'Yearly' ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card'
                  }`}
                >
                  <span className="block font-bold text-heading text-xs">Yearly <span className="text-[9px] text-emerald-600">(Save 20%)</span></span>
                  <span className="text-[11px] text-emerald-600 font-extrabold">
                    {formatCurrency(selectedPlanForCheckout.priceYearly)}/yr
                  </span>
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Price Breakdown</span>
              {(() => {
                const targetPrice = getPlanPriceForCycle(selectedPlanForCheckout, checkoutCycle);
                const currentPrice = (activeSub && activeSub.status === 'Active') ? (activeSub.amount || 0) : 0;
                
                let changeLabel = 'Subscription';
                if (activeSub && activeSub.status === 'Active') {
                  if (targetPrice > currentPrice) changeLabel = 'Upgrade';
                  else if (targetPrice < currentPrice) changeLabel = 'Downgrade';
                  else if ((activeSub.billingCycle || 'Monthly') !== checkoutCycle) changeLabel = 'Billing Cycle Change';
                }

                const unusedValue = currentPrice;
                const netAdjustment = (activeSub && activeSub.status === 'Active') ? Math.max(0, targetPrice - currentPrice) : targetPrice;
                const tax = Math.round(netAdjustment * 0.10); // GST 10%!
                const total = netAdjustment + tax;

                return (
                  <div className="space-y-1.5 text-xs">
                    {activeSub && activeSub.status === 'Active' && (
                      <div className="flex justify-between text-secondaryText">
                        <span>Current Unused Value</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(unusedValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-secondaryText">
                      <span>New Subscription Value ({checkoutCycle})</span>
                      <span className="font-bold text-heading">{formatCurrency(targetPrice)}</span>
                    </div>
                    <div className="flex justify-between text-secondaryText">
                      <span>{changeLabel} Adjustment</span>
                      <span className="font-bold text-heading">{formatCurrency(netAdjustment)}</span>
                    </div>
                    <div className="flex justify-between text-secondaryText">
                      <span>GST (10%)</span>
                      <span className="font-bold text-heading">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-extrabold text-sm text-heading">
                      <span>Total Amount Payable</span>
                      <span className="text-primary text-base">{formatCurrency(total)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Action Info Message & Buttons */}
            {(() => {
              const modalActionInfo = getActionButtonText(selectedPlanForCheckout, checkoutCycle);
              return (
                <>
                  {modalActionInfo.isCurrent && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>You are already subscribed to {selectedPlanForCheckout.name} with {checkoutCycle} billing.</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-3 border-t border-border">
                    <Button variant="outline" onClick={() => setIsCheckoutModalOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button
                      variant={modalActionInfo.isCurrent ? 'outline' : 'primary'}
                      disabled={modalActionInfo.isCurrent || isSubmitting}
                      isLoading={isSubmitting}
                      onClick={handleConfirmPurchase}
                      rightIcon={!modalActionInfo.isCurrent ? <ArrowRight className="w-4 h-4" /> : undefined}
                    >
                      {modalActionInfo.isCurrent ? 'Current Active Plan' : 'Proceed to Demo Payment'}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      <SuspendedActionModal
        isOpen={isSuspendedModalOpen}
        onClose={() => setIsSuspendedModalOpen(false)}
      />
    </div>
  );
};
