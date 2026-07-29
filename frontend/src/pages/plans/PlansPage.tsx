import React, { useState, useEffect } from 'react';
import { Layers, Check, Plus, Edit2, Trash2, Power, AlertTriangle, ShieldCheck, Database, Users as UsersIcon, Zap } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/formatters';
import { Plan } from '../../types/plan';
import { useAuth } from '../../hooks/useAuth';
import { planApi } from '../../services/api/planApi';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState<number | ''>(1999);
  const [priceYearly, setPriceYearly] = useState<number | ''>(19990);
  const [maxCustomers, setMaxCustomers] = useState<string>('1000');
  const [storageLimit, setStorageLimit] = useState<string>('50 GB');
  const [apiAccess, setApiAccess] = useState<boolean>(true);
  const [supportLevel, setSupportLevel] = useState<'Standard' | 'Priority' | 'Dedicated'>('Standard');
  const [status, setStatus] = useState<'Enabled' | 'Disabled'>('Enabled');
  const [featuresText, setFeaturesText] = useState<string>('500 Active Customers\nAutomated Invoicing & Tax\nStandard REST API');

  const fetchPlans = async () => {
    const res = await planApi.getPlans();
    if (res.success && res.data) {
      setPlans(res.data);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setPriceMonthly(1999);
    setPriceYearly(19990);
    setMaxCustomers('1000');
    setStorageLimit('50 GB');
    setApiAccess(true);
    setSupportLevel('Standard');
    setStatus('Enabled');
    setFeaturesText('500 Active Customers\nAutomated Invoicing & Tax\nStandard REST API');
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setPriceMonthly(plan.priceMonthly);
    setPriceYearly(plan.priceYearly);
    setMaxCustomers(String(plan.maxCustomers));
    setStorageLimit(plan.storageLimit || '50 GB');
    setApiAccess(plan.apiAccess ?? true);
    setSupportLevel(plan.supportLevel || 'Standard');
    setStatus(plan.status || 'Enabled');
    setFeaturesText(plan.features ? plan.features.join('\n') : '');
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyNum = Number(priceMonthly) || 0;
    const yearlyNum = Number(priceYearly) || 0;
    const featureList = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (editingPlan) {
      const res = await planApi.updatePlan(editingPlan.id, {
        name,
        description,
        priceMonthly: monthlyNum,
        priceYearly: yearlyNum,
        mrrValue: monthlyNum,
        maxCustomers,
        storageLimit,
        apiAccess,
        supportLevel,
        status,
        features: featureList,
      });
      if (res.success) {
        setToastMessage(`Plan "${name}" updated successfully.`);
        setShowToast(true);
        fetchPlans();
      }
    } else {
      const res = await planApi.createPlan({
        name,
        description,
        priceMonthly: monthlyNum,
        priceYearly: yearlyNum,
        billingCycle: 'Both',
        mrrValue: monthlyNum,
        maxCustomers,
        storageLimit,
        apiAccess,
        supportLevel,
        status,
        features: featureList,
      });
      if (res.success) {
        setToastMessage(`New Plan "${name}" created successfully.`);
        setShowToast(true);
        fetchPlans();
      }
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (plan: Plan) => {
    const nextStatus = plan.status === 'Enabled' ? 'Disabled' : 'Enabled';
    const res = await planApi.updatePlan(plan.id, { status: nextStatus });
    if (res.success) {
      setToastMessage(`Plan "${plan.name}" is now ${nextStatus}.`);
      setShowToast(true);
      fetchPlans();
    }
  };

  const confirmDelete = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    const res = await planApi.deletePlan(planToDelete.id);
    if (res.success) {
      setToastMessage(`Plan "${planToDelete.name}" deleted.`);
      setShowToast(true);
      fetchPlans();
    }
    setIsDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Plan Management & Pricing Tiers
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Configure enterprise SaaS plans, pricing limits, subscriber allocations, and features.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Monthly / Yearly Switch */}
          <div className="flex items-center gap-2 bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setBillingCycle('Monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'Monthly' ? 'bg-primary text-white shadow-sm' : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              Monthly
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

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              Create New Plan
            </Button>
          )}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = billingCycle === 'Monthly' ? plan.priceMonthly : plan.priceYearly;
          const isDisabled = plan.status === 'Disabled';

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 transition-all ${
                plan.isPopular ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''
              } ${isDisabled ? 'opacity-70 bg-slate-50 dark:bg-slate-900/50' : ''}`}
            >
              {plan.isPopular && !isDisabled && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand">Most Popular</Badge>
                </div>
              )}

              <div className="space-y-4">
                {/* Header & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-secondaryText mt-1 min-h-[32px]">
                      {plan.description}
                    </p>
                  </div>
                  <Badge variant={plan.status === 'Enabled' ? 'success' : 'neutral'}>
                    {plan.status || 'Enabled'}
                  </Badge>
                </div>

                {/* Pricing & MRR */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-heading">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-xs text-mutedText">/{billingCycle === 'Monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-primary">MRR Value: {formatCurrency(plan.mrrValue || plan.priceMonthly)}/mo</span>
                    <span className="text-mutedText font-semibold">{plan.activeSubscribers} active subscribers</span>
                  </div>
                </div>

                {/* Plan Metrics / Allocations */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-secondary/80 text-[11px] font-medium border border-border/50">
                  <div className="flex items-center gap-1.5 text-secondaryText">
                    <UsersIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Max: <strong className="text-heading">{plan.maxCustomers}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondaryText">
                    <Database className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Storage: <strong className="text-heading">{plan.storageLimit}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondaryText">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>API: <strong className="text-heading">{plan.apiAccess ? 'Enabled' : 'Restricted'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondaryText">
                    <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                    <span>Support: <strong className="text-heading">{plan.supportLevel}</strong></span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-secondaryText uppercase tracking-wider">Included Features</span>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-primaryText font-medium">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Admin Actions Footer */}
              {isAdmin && (
                <div className="pt-4 mt-6 border-t border-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      plan.status === 'Enabled'
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{plan.status === 'Enabled' ? 'Disable' : 'Enable'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => openEditModal(plan)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => confirmDelete(plan)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* CREATE / EDIT PLAN MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Pricing Plan'}
      >
        <form onSubmit={handleSavePlan} className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2">
          <Input
            label="Plan Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Enterprise Plus"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of target customer segment..."
              className="w-full bg-input border border-border text-primaryText text-xs font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/25"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monthly Price (₹)"
              type="number"
              value={priceMonthly}
              onChange={(e) => setPriceMonthly(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
            <Input
              label="Yearly Price (₹)"
              type="number"
              value={priceYearly}
              onChange={(e) => setPriceYearly(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Maximum Customers"
              value={maxCustomers}
              onChange={(e) => setMaxCustomers(e.target.value)}
              placeholder="e.g. 5000 or Unlimited"
            />
            <Input
              label="Storage Limit"
              value={storageLimit}
              onChange={(e) => setStorageLimit(e.target.value)}
              placeholder="e.g. 100 GB"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Support Level"
              value={supportLevel}
              onChange={(e) => setSupportLevel(e.target.value as any)}
              options={[
                { value: 'Standard', label: 'Standard (24h)' },
                { value: 'Priority', label: 'Priority 24/7' },
                { value: 'Dedicated', label: 'Dedicated SLA' },
              ]}
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              options={[
                { value: 'Enabled', label: 'Enabled' },
                { value: 'Disabled', label: 'Disabled' },
              ]}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText">API Access</label>
              <select
                value={apiAccess ? 'true' : 'false'}
                onChange={(e) => setApiAccess(e.target.value === 'true')}
                className="w-full p-2 text-xs rounded-xl border border-border bg-input text-primaryText font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                <option value="true">Full REST API Access</option>
                <option value="false">Restricted API Access</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText">
              Features (One feature per line)
            </label>
            <textarea
              rows={4}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Up to 5,000 Active Customers&#10;Advanced Revenue Analytics&#10;Custom Payment Gateways"
              className="w-full bg-input border border-border text-primaryText text-xs font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/25 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Plan Deletion"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-sm">Are you sure you want to delete this plan?</p>
              <p className="mt-1 opacity-90">
                You are about to permanently delete plan <strong>"{planToDelete?.name}"</strong>. Existing active subscribers will not be immediately affected, but new customers cannot select this plan.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeletePlan}>
              Yes, Delete Plan
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        isVisible={showToast}
        message={toastMessage}
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
