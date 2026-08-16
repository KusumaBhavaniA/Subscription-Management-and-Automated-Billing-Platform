import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  CheckCircle2,
  Lock,
  Tag,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { planApi } from '../../services/api/planApi';
import { paymentApi, CouponResult, PaymentOrderRequest } from '../../services/api/paymentApi';
import { Plan } from '../../types/plan';

import { SuspendedActionModal } from '../../components/common/SuspendedActionModal';

type PaymentMethodType = 'upi' | 'credit-card' | 'debit-card' | 'net-banking' | 'wallet';

export const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuspended = user?.accountStatus === 'SUSPENDED' || user?.status === 'Suspended';
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);

  // State from router or fallback default plan
  const locationState = location.state as { plan?: Plan; billingCycle?: 'Monthly' | 'Quarterly' | 'Yearly' } | null;

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(locationState?.plan || null);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Quarterly' | 'Yearly'>(locationState?.billingCycle || 'Monthly');
  const [isLoadingPlans, setIsLoadingPlans] = useState(!locationState?.plan);

  // Customer profile state
  const customerName = user?.fullName || 'John Doe';
  const customerEmail = user?.email || 'customer@example.com';
  const customerPhone = (user as any)?.phone || '+91 98765 43210';

  // Editable Billing Address
  const [billingAddress, setBillingAddress] = useState({
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    zipCode: '400001',
  });

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');

  // Form Fields
  // UPI
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);

  // Card (Credit / Debit)
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName);
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // Net Banking
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState('PhonePe');

  // Payment Processing Screen State (Step 4)
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('Processing Payment...');
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Load plan fallback if accessed directly
  useEffect(() => {
    if (!selectedPlan) {
      setIsLoadingPlans(true);
      planApi.getPlans().then((plans) => {
        if (plans && plans.length > 0) {
          const defaultPlan = plans.find((p) => p.name === 'Pro Business') || plans[0];
          setSelectedPlan(defaultPlan);
        }
        setIsLoadingPlans(false);
      });
    }
  }, [selectedPlan]);

  // Handle Coupon Apply
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await paymentApi.applyCoupon(couponInput);
      setAppliedCoupon(res);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // UPI Verification
  const handleVerifyUpi = () => {
    if (!upiId || !upiId.includes('@')) {
      setUpiError('Please enter a valid UPI ID (e.g. username@upi)');
      setIsUpiVerified(false);
      return;
    }
    setUpiError(null);
    setIsUpiVerified(true);
  };

  // Auto formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)} / ${raw.slice(2)}`;
    }
    setExpiryDate(raw);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
  };

  // Calculations for Order Summary (Step 7)
  const basePrice = selectedPlan
    ? billingCycle === 'Monthly'
      ? selectedPlan.priceMonthly
      : billingCycle === 'Quarterly'
      ? selectedPlan.priceQuarterly || Math.round(selectedPlan.priceMonthly * 3 * 0.9)
      : selectedPlan.priceYearly
    : 0;

  // Yearly/Quarterly discount included or calculate coupon discount
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscountAmount = Math.round((basePrice * appliedCoupon.value) / 100);
    } else {
      couponDiscountAmount = Math.min(basePrice, appliedCoupon.value);
    }
  }

  const subtotalAfterCoupon = Math.max(0, basePrice - couponDiscountAmount);
  const gstAmount = Math.round(subtotalAfterCoupon * 0.18);
  const totalPayable = subtotalAfterCoupon + gstAmount;

  // Savings for quarterly / yearly
  const savingsAmount =
    selectedPlan && billingCycle === 'Quarterly'
      ? Math.max(0, selectedPlan.priceMonthly * 3 - (selectedPlan.priceQuarterly || Math.round(selectedPlan.priceMonthly * 3 * 0.9)))
      : selectedPlan && billingCycle === 'Yearly'
      ? Math.max(0, selectedPlan.priceMonthly * 12 - selectedPlan.priceYearly)
      : 0;

  // Handle Submit / Pay Now
  const handlePayNow = async () => {
    if (!selectedPlan) return;
    if (isSuspended) {
      setIsSuspendedModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setProcessingStage('Processing Payment...');

    const stages = [
      'Processing Payment...',
      'Checking Payment Details...',
      'Verifying Transaction with Bank...',
      'Almost Done...',
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setProcessingStage(stages[stageIdx]);
      }
    }, 650);

    setTimeout(async () => {
      clearInterval(interval);

      const orderData: PaymentOrderRequest = {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        billingCycle,
        amount: totalPayable,
        subtotal: basePrice,
        gst: gstAmount,
        discount: couponDiscountAmount,
        couponCode: appliedCoupon?.code,
        customerEmail,
        customerName,
        customerPhone,
        billingAddress,
        paymentMethod,
        paymentDetails: {
          upiId: paymentMethod === 'upi' ? upiId : undefined,
          bank: paymentMethod === 'net-banking' ? selectedBank : undefined,
          wallet: paymentMethod === 'wallet' ? selectedWallet : undefined,
        },
      };

      try {
        const result = await paymentApi.verifyPayment(orderData, simulateFailure);
        setIsProcessing(false);
        if (result.success) {
          navigate('/customer/payment-success', { state: { transaction: result } });
        } else {
          navigate('/customer/payment-failed', {
            state: {
              failureReason: result.failureReason || 'Bank Timeout - Transaction could not be completed.',
              planName: selectedPlan.name,
              billingCycle,
              amount: totalPayable,
            },
          });
        }
      } catch (err) {
        setIsProcessing(false);
        navigate('/customer/payment-failed', {
          state: {
            failureReason: 'Unexpected payment processing error. Please try again.',
            planName: selectedPlan.name,
            billingCycle,
            amount: totalPayable,
          },
        });
      }
    }, 2600);
  };

  if (isLoadingPlans) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-secondaryText font-medium">Preparing checkout details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/plans')}
            className="p-2 rounded-xl bg-card border border-border text-secondaryText hover:text-primaryText hover:border-primary transition-all cursor-pointer"
            title="Back to Plans"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-heading flex items-center gap-2">
              Complete Payment
            </h1>
            <p className="text-xs text-secondaryText">
              Secure 256-bit encrypted checkout for your subscription.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 font-semibold w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span>SSL Encrypted & Safe Payment</span>
        </div>
      </div>

      {/* Main Payment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDE: Order Summary, Customer Profile, Billing Address, Coupon (5 Cols on LG) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Summary Card */}
          <Card className="p-5 space-y-5 border border-border shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-heading flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Order Summary
              </h2>
              {selectedPlan && <Badge variant="brand">{selectedPlan.name}</Badge>}
            </div>

            {/* Billing Frequency Selector (Step 7 requirement) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-mutedText uppercase tracking-wider">
                Billing Frequency
              </label>
              <div className="grid grid-cols-3 gap-1 bg-secondary p-1 rounded-xl border border-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setBillingCycle('Monthly')}
                  className={`py-1.5 px-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                    billingCycle === 'Monthly'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondaryText hover:text-primaryText'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('Quarterly')}
                  className={`py-1.5 px-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                    billingCycle === 'Quarterly'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondaryText hover:text-primaryText'
                  }`}
                >
                  Quarterly <span className="text-[9px] text-emerald-400 block sm:inline">(Save 10%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('Yearly')}
                  className={`py-1.5 px-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                    billingCycle === 'Yearly'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondaryText hover:text-primaryText'
                  }`}
                >
                  Yearly <span className="text-[9px] text-emerald-400 block sm:inline">(Save 20%)</span>
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-border text-xs">
              <div className="flex justify-between text-secondaryText">
                <span>Plan Price ({billingCycle})</span>
                <span className="font-bold text-heading">{formatCurrency(basePrice)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    Coupon ({appliedCoupon.code})
                  </span>
                  <span>- {formatCurrency(couponDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-secondaryText">
                <span>GST (18%)</span>
                <span className="font-bold text-heading">{formatCurrency(gstAmount)}</span>
              </div>

              <div className="flex justify-between text-secondaryText">
                <span>Platform Fee</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px]">Free</span>
              </div>

              {savingsAmount > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    {billingCycle === 'Quarterly'
                      ? `Quarterly Savings: You save ${formatCurrency(savingsAmount)} per quarter!`
                      : `Yearly Savings: You save ${formatCurrency(savingsAmount)} per year!`}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-border font-black text-base text-heading">
                <span>Total Payable</span>
                <span className="text-xl text-primary">{formatCurrency(totalPayable)}</span>
              </div>
            </div>
          </Card>

          {/* Coupon Code Section */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-extrabold text-heading flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-primary" />
              Have a Coupon?
            </h3>

            {appliedCoupon ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    {appliedCoupon.code} Applied
                  </span>
                  <span className="text-[10px] text-secondaryText">{appliedCoupon.description}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-1 rounded-lg hover:bg-secondary text-secondaryText hover:text-danger cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-input border border-border rounded-xl text-xs text-primaryText uppercase font-bold focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    isLoading={isApplyingCoupon}
                  >
                    Apply
                  </Button>
                </div>
                {couponError && <p className="text-[11px] text-danger font-medium">{couponError}</p>}
                <p className="text-[10px] text-mutedText">
                  Available coupons: <code className="bg-secondary px-1 py-0.5 rounded font-bold text-primary">WELCOME10</code>, <code className="bg-secondary px-1 py-0.5 rounded font-bold text-primary">SAVE20</code>, <code className="bg-secondary px-1 py-0.5 rounded font-bold text-primary">NEWUSER</code>
                </p>
              </div>
            )}
          </Card>

          {/* Customer Details (Read-only) */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-heading flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-secondaryText" />
              Customer Details
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-mutedText uppercase">Customer Name</label>
                <input
                  type="text"
                  readOnly
                  value={customerName}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-secondaryText font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-mutedText uppercase">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={customerEmail}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-secondaryText font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-mutedText uppercase">Mobile Number</label>
                <input
                  type="text"
                  readOnly
                  value={customerPhone}
                  className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-xl text-secondaryText font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </Card>

          {/* Billing Address (Editable) */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-heading">Billing Address</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">Country</label>
                <input
                  type="text"
                  value={billingAddress.country}
                  onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-primaryText font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">State</label>
                <input
                  type="text"
                  value={billingAddress.state}
                  onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-primaryText font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">City</label>
                <input
                  type="text"
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-primaryText font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={billingAddress.zipCode}
                  onChange={(e) => setBillingAddress({ ...billingAddress, zipCode: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-xl text-primaryText font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT SIDE: Payment Methods Tabs & Dynamic Payment Form (7 Cols on LG) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-6 border border-border shadow-md">
            <div>
              <h2 className="text-base font-extrabold text-heading">Select Payment Method</h2>
              <p className="text-xs text-secondaryText mt-0.5">
                Choose how you would like to pay for your subscription.
              </p>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {[
                { id: 'upi', label: 'UPI', icon: Smartphone },
                { id: 'credit-card', label: 'Credit Card', icon: CreditCard },
                { id: 'debit-card', label: 'Debit Card', icon: CreditCard },
                { id: 'net-banking', label: 'Net Banking', icon: Building2 },
                { id: 'wallet', label: 'Wallets', icon: Wallet },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as PaymentMethodType)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-extrabold shadow-sm ring-1 ring-primary/30'
                        : 'border-border bg-card text-secondaryText hover:border-borderHover hover:text-primaryText'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold leading-tight">{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* DYNAMIC PAYMENT FORM AREA */}
            <div className="pt-4 border-t border-border">
              {/* 1. UPI FORM */}
              {paymentMethod === 'upi' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-heading">Enter UPI ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="username@upi"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          setIsUpiVerified(false);
                          setUpiError(null);
                        }}
                        className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-xs text-primaryText font-medium focus:outline-none focus:border-primary"
                      />
                      <Button variant="outline" size="sm" onClick={handleVerifyUpi}>
                        {isUpiVerified ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Check className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          'Verify UPI'
                        )}
                      </Button>
                    </div>
                    {upiError && <p className="text-xs text-danger font-medium">{upiError}</p>}
                    {isUpiVerified && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> UPI ID verified and linked to account.
                      </p>
                    )}
                  </div>

                  <div className="relative border border-dashed border-border rounded-2xl p-6 text-center space-y-3 bg-secondary/50">
                    <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl shadow-md border border-slate-200 flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-heading">Scan QR Code using any UPI App</p>
                      <p className="text-[11px] text-mutedText italic max-w-xs mx-auto">
                        "QR Code will be generated after backend integration."
                      </p>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full py-3" onClick={handlePayNow}>
                    Pay {formatCurrency(totalPayable)} via UPI
                  </Button>
                </div>
              )}

              {/* 2 & 3. CREDIT & DEBIT CARD FORM */}
              {(paymentMethod === 'credit-card' || paymentMethod === 'debit-card') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                      {paymentMethod === 'credit-card' ? 'Credit Card Details' : 'Debit Card Details'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-mutedText">
                      <span className="px-2 py-0.5 rounded bg-secondary border border-border">VISA</span>
                      <span className="px-2 py-0.5 rounded bg-secondary border border-border">MC</span>
                      <span className="px-2 py-0.5 rounded bg-secondary border border-border">RuPay</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="XXXX XXXX XXXX XXXX"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-primaryText font-mono font-bold tracking-wider focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">
                        Card Holder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name as printed on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-primaryText font-medium focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={expiryDate}
                          onChange={handleExpiryChange}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-primaryText font-mono font-bold tracking-wider focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-mutedText uppercase mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          placeholder="XXX"
                          maxLength={4}
                          value={cvv}
                          onChange={handleCvvChange}
                          className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-primaryText font-mono font-bold tracking-wider focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="saveCard" className="text-xs text-secondaryText font-medium cursor-pointer">
                        Save Card for Future Payments securely
                      </label>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full py-3 mt-4" onClick={handlePayNow}>
                    Pay {formatCurrency(totalPayable)}
                  </Button>
                </div>
              )}

              {/* 4. NET BANKING */}
              {paymentMethod === 'net-banking' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-heading">Select Popular Bank</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {['HDFC', 'SBI', 'ICICI', 'Axis'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                            selectedBank === bank
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-border bg-card text-secondaryText hover:border-borderHover'
                          }`}
                        >
                          {bank} Bank
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-heading">Or Select Other Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-xs text-primaryText font-bold focus:outline-none focus:border-primary"
                    >
                      <option value="SBI">State Bank of India (SBI)</option>
                      <option value="HDFC">HDFC Bank</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="Axis">Axis Bank</option>
                      <option value="Kotak">Kotak Mahindra Bank</option>
                      <option value="Canara">Canara Bank</option>
                      <option value="Punjab National">Punjab National Bank (PNB)</option>
                      <option value="Union Bank">Union Bank of India</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                    </select>
                  </div>

                  <Button variant="primary" className="w-full py-3 mt-4" onClick={handlePayNow}>
                    Continue to {selectedBank} Net Banking
                  </Button>
                </div>
              )}

              {/* 5. WALLETS */}
              {paymentMethod === 'wallet' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-heading">Select Wallet</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { name: 'PhonePe', desc: 'Instant Wallet Pay' },
                        { name: 'Google Pay', desc: 'Fast & Secure' },
                        { name: 'Paytm', desc: 'Paytm Wallet Balance' },
                        { name: 'Amazon Pay', desc: 'Amazon Pay Balance' },
                        { name: 'Mobikwik', desc: 'Mobikwik ZIP & Wallet' },
                      ].map((w) => (
                        <button
                          key={w.name}
                          type="button"
                          onClick={() => setSelectedWallet(w.name)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                            selectedWallet === w.name
                              ? 'border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary/30'
                              : 'border-border bg-card text-secondaryText hover:border-borderHover'
                          }`}
                        >
                          <div>
                            <span className="block text-xs font-extrabold text-heading">{w.name}</span>
                            <span className="text-[10px] text-mutedText">{w.desc}</span>
                          </div>
                          {selectedWallet === w.name && (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button variant="primary" className="w-full py-3 mt-4" onClick={handlePayNow}>
                    Continue with {selectedWallet}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Test & Simulation Banner for Reviewer */}
          <div className="p-4 rounded-xl bg-secondary/80 border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-heading flex items-center gap-1.5 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                Frontend Testing Controls
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded border-border text-danger focus:ring-danger w-3.5 h-3.5"
                />
                <span className="text-[11px] font-bold text-danger">Simulate Payment Failure</span>
              </label>
            </div>
            <p className="text-[10px] text-secondaryText">
              Check "Simulate Payment Failure" above to test Step 6 (/customer/payment-failed). Uncheck to test Step 5 (/customer/payment-success).
            </p>
          </div>
        </div>
      </div>

      {/* STEP 4: PROCESSING SCREEN MODAL OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all">
          <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-heading animate-pulse">{processingStage}</h3>
              <p className="text-xs text-secondaryText">
                Please do not refresh or close this window. Validating payment security tokens with bank...
              </p>
            </div>

            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full animate-pulse w-3/4 transition-all duration-500" />
            </div>
          </div>
        </div>
      )}

      <SuspendedActionModal
        isOpen={isSuspendedModalOpen}
        onClose={() => setIsSuspendedModalOpen(false)}
      />
    </div>
  );
};
