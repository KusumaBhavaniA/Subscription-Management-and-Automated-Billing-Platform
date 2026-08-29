import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  Users,
  BarChart3,
  RefreshCw,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  ChevronRight,
  TrendingUp,
  Lock,
  Headphones,
  Database,
  Menu,
  X,
  Server,
  UserCheck,
  LayoutDashboard,
  Check,
} from 'lucide-react';
import { BPLogo } from '../../components/common/BPLogo';
import { useAuth } from '../../hooks/useAuth';
import { planApi } from '../../services/api/planApi';
import { Plan } from '../../types/plan';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Track scroll for sticky navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch canonical plans from backend /plans API
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        const data = await planApi.getPlans();
        if (data && data.length > 0) {
          setPlans(data);
        }
      } catch (err) {
        console.error('Failed to fetch plans for landing page:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const dashboardTarget = user?.role === 'Admin' ? '/admin/dashboard' : '/customer/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. NAVBAR */}
      {/* ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-3'
            : 'bg-white/80 backdrop-blur-sm border-b border-slate-100 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Brand Identity */}
            <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg">
              <BPLogo size="md" className="transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Nex<span className="text-blue-600">Flow</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase mt-0.5">
                  Subscription & Billing Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors focus:outline-none"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors focus:outline-none"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors focus:outline-none"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('why-nexflow')}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors focus:outline-none"
              >
                Why NexFlow
              </button>
            </nav>

            {/* Right: Auth Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to={dashboardTarget}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-md"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-md"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-md"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('why-nexflow')}
                className="text-left px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-md"
              >
                Why NexFlow
              </button>
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to={dashboardTarget}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="pt-20">
        {/* ========================================================================= */}
        {/* 2. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headlines & CTAs */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Next-Gen Subscription & Automated Billing Architecture</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Manage Subscriptions.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                    Automate Billing.
                  </span>
                  <br />
                  Grow with Confidence.
                </h1>

                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  NexFlow brings subscriptions, payments, invoices, billing insights, and customer management together in one powerful platform.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <button
                    onClick={() => scrollToSection('features')}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    Explore Features
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Single Source of Truth</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automated Invoicing & GST</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Role-Based Security</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Polished SaaS Dashboard Static Marketing Visual */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Decorative background glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                  <div className="relative rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden p-5 space-y-4">
                    {/* Header preview */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        NexFlow SaaS Console Preview
                      </span>
                    </div>

                    {/* Metric Cards Mock Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                          <span>Monthly MRR</span>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="text-xl font-bold text-slate-900 mt-1">₹4,999.00</div>
                        <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Authoritative Live Sync</div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                          <span>Billing Status</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="text-xl font-bold text-blue-600 mt-1">Active</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">Automated Lifecycle</div>
                      </div>
                    </div>

                    {/* Interactive Calculation Preview Item */}
                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                        <span className="flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-blue-600" />
                          Centralized Tax & Billing Logic
                        </span>
                        <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-mono">
                          10% GST
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Base Plan (Monthly)</span>
                          <span className="font-semibold text-slate-800">₹1,999.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculated GST (10%)</span>
                          <span className="font-semibold text-slate-800">₹200.00</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-blue-200/60 font-bold text-slate-900">
                          <span>Authoritative Total</span>
                          <span className="text-blue-700">₹2,199.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Sync Indicators */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium">Customer ↔ Admin State</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
                        Synchronized
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. TRUST / VALUE STRIP */}
        {/* ========================================================================= */}
        <section className="py-8 bg-white border-y border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                One platform for your complete billing lifecycle
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 text-center">
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Subscriptions</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Payments</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Invoices</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Customer Management</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Billing Analytics</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. FEATURES SECTION */}
        {/* ========================================================================= */}
        <section id="features" className="py-20 lg:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Platform Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Everything You Need to Run Recurring Billing
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Purpose-built modules engineered to manage plans, process payments, generate invoices, and give operators complete visibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1: Subscription Management */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">1. Subscription Management</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Create and manage active subscriptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Seamlessly upgrade or downgrade tiers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Automated renewals, proration & safe cancellations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Track real-time subscription lifecycle states</span>
                  </li>
                </ul>
              </div>

              {/* Feature 2: Automated Billing */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2. Automated Billing</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Centralized server-side billing calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Automated PDF and itemized invoice generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Authoritative 10% GST and tax computation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Multi-cycle support (Monthly, Quarterly, Yearly)</span>
                  </li>
                </ul>
              </div>

              {/* Feature 3: Payment Management */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">3. Payment Management</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Track successful, pending and failed payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Monitor payment gateways and transaction status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Maintain immutable transaction audit records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Direct relational mapping to customer invoices</span>
                  </li>
                </ul>
              </div>

              {/* Feature 4: Invoice Management */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">4. Invoice Management</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Instant invoice generation with unique invoice numbers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Track paid, pending and overdue invoices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Downloadable PDF invoices with itemized line items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Keep complete financial history organized</span>
                  </li>
                </ul>
              </div>

              {/* Feature 5: Customer Management */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-5 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">5. Customer Management</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>Manage customer profiles, billing addresses & contact data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>Track verified account status and authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>View associated subscriptions, MRR & total spent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>Keep profile edits synchronized in real time</span>
                  </li>
                </ul>
              </div>

              {/* Feature 6: Analytics & Reports */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">6. Analytics & Reports</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Monitor live Monthly Recurring Revenue (MRR)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Analyze total collected revenue and cash flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Track ARPU (Average Revenue Per User) & LTV</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Export audit-ready executive reports</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. HOW IT WORKS */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Simple & Efficient
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How NexFlow Works
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                A streamlined 4-step workflow designed to take customers from onboarding to automated subscription lifecycle management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Step 01 */}
              <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-3xl font-black text-blue-600/30 mb-2">01</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Create Your Account</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Register and set up your billing workspace with email OTP verification.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-semibold text-blue-600">
                  <UserCheck className="w-4 h-4" />
                  <span>Instant Setup</span>
                </div>
              </div>

              {/* Step 02 */}
              <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-3xl font-black text-blue-600/30 mb-2">02</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Choose a Plan</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Select the subscription plan that fits your business needs and billing cycle.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-semibold text-blue-600">
                  <Layers className="w-4 h-4" />
                  <span>Flexible Catalog</span>
                </div>
              </div>

              {/* Step 03 */}
              <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-3xl font-black text-blue-600/30 mb-2">03</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Billing</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Handle subscriptions, payments and invoices seamlessly from one place.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-semibold text-blue-600">
                  <CreditCard className="w-4 h-4" />
                  <span>Automated Invoicing</span>
                </div>
              </div>

              {/* Step 04 */}
              <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-3xl font-black text-blue-600/30 mb-2">04</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Track & Grow</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Use billing insights and analytics to understand revenue and customer health.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-semibold text-blue-600">
                  <BarChart3 className="w-4 h-4" />
                  <span>Real-time MRR</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. PLATFORM WORKFLOW / ECOSYSTEM */}
        {/* ========================================================================= */}
        <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-blue-50/40 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Connected Billing Ecosystem
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How Every Event Connects Across the Lifecycle
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Every billing event flows through a connected system, keeping customer, subscription, payment, invoice and reporting information consistent.
              </p>
            </div>

            {/* Visual Workflow Pipeline */}
            <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                {/* Node 1 */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-2">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-900">Customer</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Profile & Auth</span>
                </div>

                {/* Node 2 */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-2">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-900">Subscription</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Plan Selection</span>
                </div>

                {/* Node 3 */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm mb-2">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-900">Calculation</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Tax & Proration</span>
                </div>

                {/* Node 4 */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2">
                    4
                  </div>
                  <span className="text-xs font-bold text-slate-900">Payment</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Transaction Auth</span>
                </div>

                {/* Node 5 */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm mb-2">
                    5
                  </div>
                  <span className="text-xs font-bold text-slate-900">Invoice</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Itemized Records</span>
                </div>

                {/* Node 6 */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm mb-2">
                    6
                  </div>
                  <span className="text-xs font-bold text-slate-900">Analytics</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">MRR & Reports</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Centralized state guarantees that when a customer upgrades or cancels, invoices, payments, and admin metrics synchronize immediately without stale cache discrepancies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. PRICING SECTION */}
        {/* ========================================================================= */}
        <section id="pricing" className="py-20 lg:py-28 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Transparent Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Simple Plans Tailored to Your Growth
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Synchronized directly with the backend catalog. Choose your billing interval for maximum savings.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="pt-4 flex items-center justify-center">
                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    onClick={() => setBillingCycle('Monthly')}
                    className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                      billingCycle === 'Monthly'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('Quarterly')}
                    className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                      billingCycle === 'Quarterly'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Quarterly
                  </button>
                  <button
                    onClick={() => setBillingCycle('Yearly')}
                    className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                      billingCycle === 'Yearly'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yearly (Best Value)
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            {loadingPlans ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                {plans.map((p) => {
                  const isPopular = p.name.toLowerCase().includes('pro') || p.isPopular;
                  const price =
                    billingCycle === 'Yearly'
                      ? p.priceYearly
                      : billingCycle === 'Quarterly'
                      ? p.priceQuarterly
                      : p.priceMonthly;

                  const cycleSuffix =
                    billingCycle === 'Yearly' ? '/year' : billingCycle === 'Quarterly' ? '/quarter' : '/month';

                  return (
                    <div
                      key={p.id}
                      className={`relative rounded-2xl bg-white border flex flex-col justify-between p-8 transition-all ${
                        isPopular
                          ? 'border-blue-600 shadow-xl ring-2 ring-blue-600/20'
                          : 'border-slate-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide uppercase shadow-sm">
                          Most Popular
                        </div>
                      )}

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">{p.name}</h3>
                          <p className="text-sm text-slate-500 mt-2 min-h-[40px] leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="pb-6 border-b border-slate-100">
                          <div className="flex items-baseline">
                            <span className="text-4xl font-extrabold text-slate-900">
                              ₹{price?.toLocaleString('en-IN')}
                            </span>
                            <span className="text-sm font-medium text-slate-500 ml-1.5">{cycleSuffix}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-1">+ 10% standard GST</span>
                        </div>

                        {/* Limits strip */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 py-1">
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[10px]">Capacity</span>
                            <span className="font-semibold">{p.maxCustomers || 'Unlimited'}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[10px]">Support</span>
                            <span className="font-semibold">{p.supportLevel || 'Standard'}</span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3 pt-2">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                            Included Features:
                          </span>
                          <ul className="space-y-2.5 text-sm text-slate-600">
                            {p.features && p.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-8">
                        <Link
                          to={`/register?plan=${encodeURIComponent(p.name)}`}
                          className={`w-full inline-flex items-center justify-center px-5 py-3 text-sm font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isPopular
                              ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg focus:ring-blue-500'
                              : 'text-slate-800 bg-slate-100 hover:bg-slate-200 focus:ring-slate-300'
                          }`}
                        >
                          <span>Get Started</span>
                          <ChevronRight className="w-4 h-4 ml-1.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. WHY NEXFLOW */}
        {/* ========================================================================= */}
        <section id="why-nexflow" className="py-20 lg:py-28 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Architectural Advantage
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Why NexFlow — One Connected Billing System
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Eliminate disconnected spreadsheets, fragmented invoicing tools, and out-of-sync databases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Centralized Subscriptions</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Single source of truth for customer plans, active cycles, renewal schedules, and proration state.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Accurate Calculations</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Authoritative server-side tax computation and automatic proration adjustment during plan transitions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Connected Invoicing</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every processed payment immediately links to an itemized invoice, keeping financial records organized.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Customer ↔ Admin Sync</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Any customer update — profile edit, plan upgrade, or payment — is immediately visible on the operator dashboard.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Real-Time Insights</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Direct derivation of MRR, total revenue, ARPU, and paid invoice metrics directly from database tables.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Role-Based Access (RBAC)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Strict segregation between customer self-service workspaces and administrative operations consoles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. CUSTOMER + ADMIN EXPERIENCE */}
        {/* ========================================================================= */}
        <section className="py-20 lg:py-28 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Two Purpose-Built Workspaces
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Designed for Customers & Administrators
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Customers manage their billing experience while administrators get a complete operational view.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Customer Workspace Card */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Customer Workspace</h3>
                      <span className="text-xs text-slate-500">Self-Service Portal</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    A clean, frictionless interface for subscribers to browse plans, track invoices, make payments, and view billing history.
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>View & Compare Plans</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manage Subscriptions</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Download Invoices</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Payment History</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Billing Summary</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Support Helpdesk</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200">
                  <Link
                    to="/register"
                    className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Register as Customer</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </div>
              </div>

              {/* Admin Console Card */}
              <div className="rounded-2xl bg-slate-900 text-white border border-slate-800 p-8 flex flex-col justify-between shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Admin Console</h3>
                      <span className="text-xs text-slate-400">Operations & Finance</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    Comprehensive operations dashboard for platform administrators to oversee revenue, subscribers, catalog tiers, and tickets.
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-200">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>Executive Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>Customer Directory</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>Plan Catalog Config</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>All Subscriptions</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>Financial Invoices</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>MRR & Reports</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <span>Sign In to Admin Console</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. FINAL CTA SECTION */}
        {/* ========================================================================= */}
        <section className="py-20 lg:py-24 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Get Started in Minutes</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to simplify subscription billing?
            </h2>

            <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Bring subscriptions, payments, invoices and billing insights together with NexFlow.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
              >
                <span>Get Started with NexFlow</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 11. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-slate-400 text-sm py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Brand Col */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <BPLogo size="md" className="brightness-125" />
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-white leading-none">
                    Nex<span className="text-blue-400">Flow</span>
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                    Subscription & Billing Platform
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Centralized subscription management, automated invoicing, tax calculation, and real-time revenue analytics for modern digital businesses.
              </p>
            </div>

            {/* Col 1: Product */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">
                    Pricing
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 2: Support */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => scrollToSection('why-nexflow')} className="hover:text-white transition-colors">
                    Why NexFlow
                  </button>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Helpdesk & Tickets
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Knowledge Base
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Account */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link to="/customer/support" className="hover:text-white transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-10 mt-10 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 NexFlow. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Subscription & Automated Billing Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
