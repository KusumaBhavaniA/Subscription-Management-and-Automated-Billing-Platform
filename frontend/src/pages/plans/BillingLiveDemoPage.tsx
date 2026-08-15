import React, { useEffect, useState } from 'react';
import {
  Zap,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ServerCog,
  Receipt,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';
import {
  billingBackendApi,
  BillingPlan,
  BillingSubscription,
  ProrationPreview,
  BillingInvoice,
} from '../../services/api/billingBackendApi';

const money = (value: string | number) => formatCurrency(Number(value), '$');

export const BillingLiveDemoPage: React.FC = () => {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProrationPreview | null>(null);
  const [lastInvoice, setLastInvoice] = useState<BillingInvoice | null>(null);
  const [pastInvoices, setPastInvoices] = useState<BillingInvoice[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansRes, subRes, invoicesRes] = await Promise.all([
        billingBackendApi.getPlans(),
        billingBackendApi.getMySubscription(),
        billingBackendApi.listInvoices(),
      ]);

      if (!plansRes.success) throw new Error(plansRes.message);
      if (!subRes.success) throw new Error(subRes.message);

      setPlans(plansRes.data || []);
      setSubscription(subRes.data || null);
      setPastInvoices(invoicesRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Could not reach the billing backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSelectPlan = async (code: string) => {
    if (!subscription) return;
    setSelectedPlanCode(code);
    setPreview(null);
    setLastInvoice(null);
    setError(null);

    if (code === subscription.plan.code) return;

    setIsPreviewing(true);
    try {
      const res = await billingBackendApi.previewProration(subscription.id, code);
      if (!res.success || !res.data) throw new Error(res.message);
      setPreview(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to compute proration preview.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!subscription || !selectedPlanCode) return;
    setIsUpgrading(true);
    setError(null);
    try {
      const res = await billingBackendApi.upgrade(subscription.id, selectedPlanCode);
      if (!res.success || !res.data) throw new Error(res.message);
      setLastInvoice(res.data);
      setPreview(null);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade subscription.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
          <ServerCog className="w-6 h-6 text-primary" />
          Live Billing Engine Demo
        </h1>
        <p className="text-xs text-secondaryText mt-1 font-medium">
          Every number on this page comes from a real request to the FastAPI backend —
          proration math and invoice generation, not mock data.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger-text text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Current subscription */}
          {subscription && (
            <Card className="p-5 border border-border">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider">
                    Current Subscription (from backend)
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-lg font-extrabold text-heading">{subscription.plan.name}</h2>
                    <Badge variant="brand">{money(subscription.plan.monthly_price)}/mo</Badge>
                    <Badge variant="success">{subscription.status}</Badge>
                  </div>
                  <p className="text-[11px] text-secondaryText mt-1">
                    Cycle: {subscription.current_period_start} → {subscription.current_period_end}
                  </p>
                </div>
                <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loadAll}>
                  Refresh from backend
                </Button>
              </div>
            </Card>
          )}

          {/* Plan picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = subscription?.plan.code === plan.code;
              const isSelected = selectedPlanCode === plan.code;
              return (
                <Card
                  key={plan.code}
                  className={`p-5 border cursor-pointer transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                  }`}
                  onClick={() => handleSelectPlan(plan.code)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-heading">{plan.name}</h3>
                    {isCurrent && <Badge variant="neutral">Current</Badge>}
                  </div>
                  <p className="text-xl font-extrabold text-primary mt-2">
                    {money(plan.monthly_price)}
                    <span className="text-xs text-secondaryText font-semibold">/mo</span>
                  </p>
                  <Button
                    variant={isCurrent ? 'outline' : 'primary'}
                    size="sm"
                    className="w-full mt-4"
                    disabled={isCurrent}
                    rightIcon={!isCurrent ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isCurrent ? 'Active Plan' : 'Preview Change'}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Proration preview (from POST /billing/subscriptions/{id}/proration-preview) */}
          {isPreviewing && (
            <div className="flex items-center gap-2 text-xs text-secondaryText font-semibold">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              Calling backend for live proration calculation...
            </div>
          )}

          {preview && (
            <Card className="p-5 border border-primary/40 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-heading text-sm">
                  Proration Preview: {preview.old_plan_name} → {preview.new_plan_name}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-secondaryText block">Days in cycle</span>
                  <span className="font-bold text-heading">{preview.days_in_cycle}</span>
                </div>
                <div>
                  <span className="text-secondaryText block">Days remaining</span>
                  <span className="font-bold text-heading">{preview.days_remaining}</span>
                </div>
                <div>
                  <span className="text-secondaryText block">Unused credit</span>
                  <span className="font-bold text-emerald-600">-{money(preview.unused_credit)}</span>
                </div>
                <div>
                  <span className="text-secondaryText block">New plan charge</span>
                  <span className="font-bold text-heading">{money(preview.new_plan_charge)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs font-bold text-heading">
                  Net amount due now: <span className="text-primary">{money(preview.net_amount)}</span>
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUpgrading}
                  onClick={handleConfirmUpgrade}
                  rightIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Confirm Upgrade
                </Button>
              </div>
            </Card>
          )}

          {/* Real invoice returned from POST /upgrade */}
          {lastInvoice && (
            <Card className="p-5 border border-emerald-500/40 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-heading text-sm">
                  Invoice Generated: {lastInvoice.invoice_number}
                </h3>
              </div>
              <div className="space-y-1.5 text-xs">
                {lastInvoice.line_items.map((li) => (
                  <div key={li.id} className="flex justify-between text-secondaryText">
                    <span>{li.description}</span>
                    <span className={`font-bold ${Number(li.amount) < 0 ? 'text-emerald-600' : 'text-heading'}`}>
                      {money(li.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 border-t border-border text-sm font-extrabold text-heading">
                <span>Total</span>
                <span>{money(lastInvoice.total_amount)}</span>
              </div>
            </Card>
          )}

          {/* Past invoices, all pulled live from the backend */}
          {pastInvoices.length > 0 && (
            <Card className="p-5 border border-border">
              <h3 className="font-extrabold text-heading text-sm mb-3">All Invoices (from backend)</h3>
              <div className="space-y-2">
                {pastInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-secondary"
                  >
                    <span className="font-mono font-bold text-heading">{inv.invoice_number}</span>
                    <span className="text-secondaryText">
                      {inv.period_start} → {inv.period_end}
                    </span>
                    <Badge variant="info">{inv.status}</Badge>
                    <span className="font-extrabold text-heading">{money(inv.total_amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};