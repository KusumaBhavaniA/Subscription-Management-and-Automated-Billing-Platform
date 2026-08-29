import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  Check,
  Plus,
  Edit,
  Trash2,
  Power,
  Users,
  HardDrive,
  Code2,
  Headphones,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Switch } from '../../components/common/Switch';
import { PageHeader } from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatters';
import { Plan } from '../../types/plan';
import { planApi } from '../../services/api/planApi';
import { subscriptionManagementApi } from '../../services/api/subscriptionManagementApi';
import { Subscription } from '../../types/subscription';
import { useAuth } from '../../hooks/useAuth';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const changeContext = searchParams.get('change'); // 'upgrade' | 'downgrade' | null

  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<Plan | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetPlan, setDeleteTargetPlan] = useState<Plan | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form State
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('');
  const [priceQuarterly, setPriceQuarterly] = useState('');
  const [priceYearly, setPriceYearly] = useState('');
  const [maxCustomers, setMaxCustomers] = useState('');
  const [storage, setStorage] = useState('');
  const [apiAccess, setApiAccess] = useState('');
  const [supportLevel, setSupportLevel] = useState('');
  const [featuresStr, setFeaturesStr] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadPlans = async () => {
    const list = await planApi.getPlans();
    setPlans(list);
  };

  useEffect(() => {
    loadPlans();
    if (user?.email) {
      subscriptionManagementApi.getSubscriptionByEmail(user.email).then((sub) => {
        if (sub && sub.status === 'Active') {
          setCurrentSub(sub);
        }
      });
    }
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setDescription('');
    setPriceMonthly('');
    setPriceQuarterly('');
    setPriceYearly('');
    setMaxCustomers('1,000 Customers');
    setStorage('50 GB Cloud Storage');
    setApiAccess('Standard REST API');
    setSupportLevel('24/7 Email Support');
    setFeaturesStr('Automated Invoicing & Tax\nStandard Webhook Triggers');
    setIsPopular(false);
    setIsEnabled(true);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setDescription(plan.description);
    setPriceMonthly(plan.priceMonthly.toString());
    setPriceQuarterly(plan.priceQuarterly ? plan.priceQuarterly.toString() : Math.round(plan.priceMonthly * 3 * 0.9).toString());
    setPriceYearly(plan.priceYearly.toString());
    setMaxCustomers(plan.maxCustomers || '1,000 Customers');
    setStorage(plan.storage || '50 GB Cloud Storage');
    setApiAccess(plan.apiAccess || 'Standard REST API');
    setSupportLevel(plan.supportLevel || '24/7 Email Support');
    setFeaturesStr(plan.features.join('\n'));
    setIsPopular(plan.isPopular || false);
    setIsEnabled(plan.isEnabled !== undefined ? plan.isEnabled : true);
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!planName.trim() || !priceMonthly || !priceQuarterly || !priceYearly) {
      setValidationError('Please fill in all required price fields.');
      return;
    }

    const pMonthly = Number(priceMonthly);
    const pQuarterly = Number(priceQuarterly);
    const pYearly = Number(priceYearly);

    if (pQuarterly <= pMonthly) {
      setValidationError(`Quarterly price (₹${pQuarterly}) must be greater than Monthly price (₹${pMonthly}).`);
      return;
    }

    if (pQuarterly >= pMonthly * 3) {
      setValidationError(`Quarterly price (₹${pQuarterly}) must be less than 3 × Monthly price (₹${pMonthly * 3}).`);
      return;
    }

    if (pYearly >= pMonthly * 12) {
      setValidationError(`Yearly price (₹${pYearly}) must be less than 12 × Monthly price (₹${pMonthly * 12}).`);
      return;
    }

    setIsLoading(true);
    const featuresList = featuresStr
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingPlan) {
        await planApi.updatePlan(editingPlan.id, {
          name: planName,
          description,
          priceMonthly: pMonthly,
          priceQuarterly: pQuarterly,
          priceYearly: pYearly,
          maxCustomers,
          storage,
          apiAccess,
          supportLevel,
          features: featuresList,
          isPopular,
          isEnabled,
        });
      } else {
        await planApi.createPlan({
          name: planName,
          description,
          priceMonthly: pMonthly,
          priceQuarterly: pQuarterly,
          priceYearly: pYearly,
          maxCustomers,
          storage,
          apiAccess,
          supportLevel,
          features: featuresList,
          isPopular,
          isEnabled,
        });
      }
      await loadPlans();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnable = async (planId: string) => {
    await planApi.toggleEnablePlan(planId);
    await loadPlans();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetPlan) return;
    setIsLoading(true);
    try {
      await planApi.deletePlan(deleteTargetPlan.id);
      await loadPlans();
      setDeleteTargetPlan(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Active Subscription Banner for Customers */}
      {!isAdmin && currentSub && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold text-heading block">Current Active Subscription</span>
              <span className="text-secondaryText">
                Plan: <strong className="text-primary">{currentSub.planName}</strong> ({currentSub.billingCycle || 'Monthly'}) — {formatCurrency(currentSub.amount)}
              </span>
            </div>
          </div>
          {changeContext && (
            <Badge variant="brand" className="text-xs py-1 px-3">
              Mode: {changeContext.toUpperCase()} PLAN
            </Badge>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Plan Management System"
          subtitle="Configure SaaS subscription pricing tiers, customer quotas, cloud storage, API access, and MRR metrics."
          icon={Layers}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setBillingCycle('Monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                billingCycle === 'Monthly' ? 'bg-primary text-white shadow-xs' : 'text-secondaryText hover:text-heading'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('Quarterly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                billingCycle === 'Quarterly' ? 'bg-primary text-white shadow-xs' : 'text-secondaryText hover:text-heading'
              }`}
            >
              Quarterly <span className="text-[10px] text-emerald-500 font-bold">(Save 10%)</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('Yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                billingCycle === 'Yearly' ? 'bg-primary text-white shadow-xs' : 'text-secondaryText hover:text-heading'
              }`}
            >
              Yearly <span className="text-[10px] text-emerald-500 font-bold">(Save 20%)</span>
            </button>
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreateModal}
            >
              Create Plan
            </Button>
          )}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price =
            billingCycle === 'Monthly'
              ? plan.priceMonthly
              : billingCycle === 'Quarterly'
              ? plan.priceQuarterly || Math.round(plan.priceMonthly * 3 * 0.9)
              : plan.priceYearly;

          const priceUnit =
            billingCycle === 'Monthly' ? '/month' : billingCycle === 'Quarterly' ? '/quarter' : '/year';

          const savingsText =
            billingCycle === 'Quarterly' ? 'Save 10%' : billingCycle === 'Yearly' ? 'Save 20%' : null;

          const estimatedMRR = plan.priceMonthly * (plan.activeSubscribers || 0);
          const activeState = plan.isEnabled !== false;
          const isCurrentPlan = currentSub?.planName.toLowerCase() === plan.name.toLowerCase() && (currentSub?.billingCycle || 'Monthly') === billingCycle;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 transition-all duration-200 border rounded-2xl ${
                plan.isPopular && activeState
                  ? 'border-primary/60 ring-2 ring-primary/20 shadow-md bg-surface'
                  : 'border-border bg-card'
              } ${!activeState ? 'opacity-60 bg-secondary/40' : ''}`}
            >
              {/* Badges Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                {plan.isPopular && activeState ? (
                  <Badge variant="brand">Most Popular</Badge>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeState
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {activeState ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name & Admin Action Icons */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-heading tracking-tight">{plan.name}</h3>
                    <p className="text-xs text-secondaryText mt-1 min-h-[36px] font-medium leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleEnable(plan.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          activeState
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                        title={activeState ? 'Disable Plan' : 'Enable Plan'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(plan)}
                        className="p-1.5 rounded-lg border border-border hover:bg-secondary text-secondaryText hover:text-heading transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetPlan(plan)}
                        className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Price & MRR Section */}
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-heading tracking-tight">{formatCurrency(price)}</span>
                      <span className="text-xs text-mutedText font-semibold">{priceUnit}</span>
                    </div>
                    {savingsText && (
                      <Badge variant="success" size="sm">{savingsText}</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
                    <div>
                      <span className="text-mutedText font-semibold block uppercase text-[9px] tracking-wider">Subscribers</span>
                      <span className="font-bold text-primary">{plan.activeSubscribers} Active</span>
                    </div>
                    <div>
                      <span className="text-mutedText font-semibold block uppercase text-[9px] tracking-wider">Plan MRR</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(estimatedMRR)}</span>
                    </div>
                  </div>
                </div>

                {/* Specifications List */}
                <div className="space-y-2 pt-3 border-t border-border text-xs">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Plan Specifications</span>

                  <div className="flex items-center gap-2 text-secondaryText font-medium">
                    <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Max Customers: <strong className="text-heading font-semibold">{plan.maxCustomers || '1,000 Customers'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-secondaryText font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Storage: <strong className="text-heading font-semibold">{plan.storage || '50 GB Storage'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-secondaryText font-medium">
                    <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>API Access: <strong className="text-heading font-semibold">{plan.apiAccess || 'Standard REST API'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-secondaryText font-medium">
                    <Headphones className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Support: <strong className="text-heading font-semibold">{plan.supportLevel || '24/7 Support'}</strong></span>
                  </div>
                </div>

                {/* Included Features */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Included Features</span>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-primaryText font-medium">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Customer Select / Change Plan Action Button */}
                {!isAdmin && (
                  <div className="pt-4 border-t border-border">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full text-xs font-bold" disabled>
                        Current Plan ({billingCycle})
                      </Button>
                    ) : (
                      <Button
                        variant={plan.isPopular ? 'primary' : 'outline'}
                        className="w-full text-xs font-bold cursor-pointer"
                        onClick={() => setSelectedPlanForChange(plan)}
                      >
                        {currentSub
                          ? price > (currentSub.amount || 0)
                            ? `Upgrade to ${plan.name}`
                            : `Downgrade / Select ${plan.name}`
                          : `Select ${plan.name}`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* PLAN CHANGE ORDER SUMMARY MODAL */}
      {selectedPlanForChange && (() => {
        const newPrice = billingCycle === 'Monthly'
          ? selectedPlanForChange.priceMonthly
          : billingCycle === 'Quarterly'
          ? (selectedPlanForChange.priceQuarterly || Math.round(selectedPlanForChange.priceMonthly * 3 * 0.9))
          : selectedPlanForChange.priceYearly;

        const currentPrice = currentSub ? currentSub.amount : 0;
        const isUpgrade = !currentSub || newPrice >= currentPrice;
        const baseAdjustment = isUpgrade ? Math.max(0, newPrice - currentPrice) : newPrice;
        const gst = Math.round(baseAdjustment * 0.10); // 10% GST as requested in Section 8!
        const totalPayable = baseAdjustment + gst;

        return (
          <Modal
            isOpen={!!selectedPlanForChange}
            onClose={() => setSelectedPlanForChange(null)}
            title={currentSub ? 'Subscription Change Order Summary' : 'Subscription Checkout Order Summary'}
            size="md"
          >
            <div className="space-y-4 text-xs">
              {currentSub && (
                <div className="p-3 rounded-xl bg-secondary border border-border space-y-1">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Current Subscription</span>
                  <div className="flex justify-between font-bold text-heading">
                    <span>{currentSub.planName} ({currentSub.billingCycle || 'Monthly'})</span>
                    <span>{formatCurrency(currentSub.amount)}</span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Selected New Subscription</span>
                <div className="flex justify-between font-extrabold text-heading">
                  <span>{selectedPlanForChange.name} ({billingCycle})</span>
                  <span className="text-primary">{formatCurrency(newPrice)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border text-xs">
                <div className="flex justify-between text-secondaryText">
                  <span>Base Price Adjustment</span>
                  <span className="font-bold text-heading">{formatCurrency(baseAdjustment)}</span>
                </div>
                <div className="flex justify-between text-secondaryText">
                  <span>GST (10%)</span>
                  <span className="font-bold text-heading">{formatCurrency(gst)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-heading pt-2 border-t border-border">
                  <span>Total Amount Payable</span>
                  <span className="text-primary text-base">{formatCurrency(totalPayable)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setSelectedPlanForChange(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => {
                    const targetPlan = selectedPlanForChange;
                    const calc = {
                      newSubscriptionValue: newPrice,
                      unusedValue: currentPrice,
                      adjustment: baseAdjustment,
                      gst,
                      totalPayable,
                      isUpgrade,
                      isDowngrade: !isUpgrade && currentPrice > 0,
                      currentPlanName: currentSub?.planName || null,
                      targetPlanName: targetPlan.name,
                      billingCycle,
                    };
                    setSelectedPlanForChange(null);
                    navigate('/customer/payment', {
                      state: {
                        plan: targetPlan,
                        billingCycle,
                        calculation: calc,
                      },
                    });
                  }}

                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* CREATE / EDIT PLAN MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Plan Management Tier' : 'Create Subscription Plan Tier'}
        description="Configure subscription pricing, customer quotas, cloud storage, API access, and features."
        size="xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-5 text-xs">
          {/* SECTION 1: PLAN INFORMATION */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section 1: Plan Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Plan Name *"
                placeholder="e.g. Pro Business"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
              />
              <Input
                label="Plan Description"
                placeholder="Overview of target customer tier and capabilities"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 2: PRICING */}
          <div className="space-y-3 pt-3 border-t border-border">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section 2: Pricing Configuration
            </span>
            <p className="text-[11px] text-secondaryText italic font-medium">
              Recommended: Quarterly should provide approximately 10% savings compared to three monthly payments.
            </p>

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Monthly Price (₹) *"
                type="number"
                placeholder="4999"
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                required
              />
              <Input
                label="Quarterly Price (₹) *"
                type="number"
                placeholder="13499"
                value={priceQuarterly}
                onChange={(e) => setPriceQuarterly(e.target.value)}
                required
              />
              <Input
                label="Yearly Price (₹) *"
                type="number"
                placeholder="49990"
                value={priceYearly}
                onChange={(e) => setPriceYearly(e.target.value)}
                required
              />
            </div>
          </div>

          {/* SECTION 3: LIMITS & SPECIFICATIONS */}
          <div className="space-y-3 pt-3 border-t border-border">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section 3: Quotas & Specifications
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Maximum Customers"
                placeholder="e.g. 5,000 Customers / Unlimited"
                value={maxCustomers}
                onChange={(e) => setMaxCustomers(e.target.value)}
              />
              <Input
                label="Storage Allocation"
                placeholder="e.g. 100 GB Cloud Storage"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="API Access Level"
                placeholder="e.g. Full REST API + Webhooks"
                value={apiAccess}
                onChange={(e) => setApiAccess(e.target.value)}
              />
              <Input
                label="Support SLA Level"
                placeholder="e.g. Priority 24/7 Support (2h SLA)"
                value={supportLevel}
                onChange={(e) => setSupportLevel(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 4: INCLUDED FEATURES */}
          <div className="space-y-3 pt-3 border-t border-border">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section 4: Included Features (One Per Line)
            </span>
            <textarea
              rows={3}
              value={featuresStr}
              onChange={(e) => setFeaturesStr(e.target.value)}
              placeholder="Automated Invoicing & Tax&#10;Webhook Integrations&#10;Custom Payment Gateways"
              className="w-full p-3 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium resize-y"
            />
          </div>

          {/* SECTION 5: PLAN OPTIONS */}
          <div className="space-y-3 pt-3 border-t border-border">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Section 5: Plan Options
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-secondary border border-border">
              <Switch
                label="Mark as Most Popular"
                description="Highlight with a prominent badge"
                checked={isPopular}
                onChange={() => setIsPopular(!isPopular)}
              />

              <Switch
                label="Enable Plan Tier"
                description="Allow customer subscriptions"
                checked={isEnabled}
                onChange={() => setIsEnabled(!isEnabled)}
              />
            </div>
          </div>

          {/* STICKY FOOTER */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card z-10">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION BEFORE DELETE MODAL */}
      {deleteTargetPlan && (
        <Modal
          isOpen={!!deleteTargetPlan}
          onClose={() => setDeleteTargetPlan(null)}
          title="Confirm Plan Deletion"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <p className="font-semibold">
                Are you sure you want to permanently delete the plan <strong className="font-extrabold">{deleteTargetPlan.name}</strong>?
              </p>
            </div>

            <p className="text-secondaryText leading-relaxed">
              This action cannot be undone. Active subscribers ({deleteTargetPlan.activeSubscribers}) will retain access until their current billing cycle ends.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetPlan(null)} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={isLoading} onClick={handleConfirmDelete}>
                Delete Plan Tier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
