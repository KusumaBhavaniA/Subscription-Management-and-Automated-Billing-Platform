import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, ShieldCheck, UserCheck, AlertCircle, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BPLogo } from '../../components/common/BPLogo';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Modal } from '../../components/common/Modal';
import { authService } from '../../services/authService';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole>('Customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = (location.state as any)?.message;

  const [isSuspended, setIsSuspended] = useState(false);

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setError(null);
    setIsUnverified(false);
    setIsSuspended(false);
    setFullName('');
    setEmail('');
    setPassword('');
  };

  const validateEmailFormat = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const openForgotPassword = () => {
    setForgotPasswordEmail(email);
    setForgotPasswordNotice(null);
    setForgotPasswordError(null);
    setIsForgotPasswordOpen(true);
  };

  const handleSendResetLink = async () => {
    setForgotPasswordError(null);

    if (!validateEmailFormat(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address.');
      return;
    }

    setIsSendingReset(true);
    try {
      const response = await authService.forgotPassword(forgotPasswordEmail.trim().toLowerCase());
      if (!response?.success) {
        throw new Error(response?.error || response?.message || 'Failed to send reset instructions.');
      }
      setForgotPasswordNotice(
        response.message || 'If that email is registered, you will receive a reset link shortly.'
      );
    } catch (err: any) {
      setForgotPasswordError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setIsSuspended(false);

    if (activeTab === 'Customer') {
      if (!fullName.trim()) {
        setError('Full Name is required.');
        return;
      }
      if (fullName.trim().length < 3) {
        setError('Full Name must be at least 3 characters.');
        return;
      }
      if (!email.trim()) {
        setError('Email Address is required.');
        return;
      }
      if (!validateEmailFormat(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!password) {
        setError('Password is required.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
    } else {
      if (!email.trim()) {
        setError('Email Address is required.');
        return;
      }
      if (!validateEmailFormat(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!password) {
        setError('Password is required.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const session = await login(
        email,
        password,
        activeTab,
        activeTab === 'Customer' ? fullName : undefined
      );
      if (session.user.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      if (msg.includes('verify your email')) {
        setError(msg);
        setIsUnverified(true);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-primaryText selection:bg-primary selection:text-white transition-colors duration-200">
      {/* LEFT COLUMN: Brand showcase (visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-border">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <BPLogo size="md" className="brightness-110 drop-shadow-md" />
          <div>
            <span className="text-lg font-black tracking-tight text-white block">NexFlow</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Subscription & Billing Platform</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Enterprise Billing Automation
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Automate subscription lifecycle, recurring billing, and revenue operations.
          </h2>

          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Enterprise-grade subscription management platform with unified customer lifecycle control, real-time MRR analytics, automated invoice generation, and multi-tier plan operations.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-2xl font-black text-white">99.9%</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Uptime SLA</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Audit-Ready</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">Instant</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Tax Invoicing</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
          <span>© 2026 NexFlow Inc. All rights reserved.</span>
          <span className="text-[11px] font-mono">v2.4.0-production</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center space-y-2 mb-4">
            <div className="inline-flex items-center justify-center">
              <BPLogo size="lg" className="shadow-lg" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-heading">NexFlow</h1>
            <p className="text-xs text-secondaryText font-medium">Subscription & Billing Platform</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-heading">
              Welcome back
            </h2>
            <p className="text-xs text-secondaryText font-medium">
              Please enter your credentials to access the platform.
            </p>
          </div>

          {/* Success Banner if redirected from verification */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Card */}
          <div className="rounded-2xl p-6 sm:p-8 bg-card border border-border shadow-sm space-y-5">
            {/* ROLE SELECTOR TABS */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-secondary border border-border gap-1">
              <button
                type="button"
                onClick={() => handleTabChange('Customer')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'Customer'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondaryText hover:text-heading'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('Admin')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'Admin'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondaryText hover:text-heading'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Admin</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl text-xs space-y-2 text-left font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                      <span>{error}</span>
                    </div>

                    {isUnverified && (
                      <button
                        type="button"
                        onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-danger text-white font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-colors text-[11px]"
                      >
                        <span>Verify Email Now</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {activeTab === 'Customer' && (
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Rohan Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder={activeTab === 'Admin' ? 'admin@company.com' : 'user@company.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              {/* LINKS FOOTER */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-secondaryText font-semibold hover:text-primary transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>

                {activeTab === 'Customer' && (
                  <Link
                    to="/register"
                    className="font-bold text-primary hover:underline transition-colors"
                  >
                    Create Account
                  </Link>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In as {activeTab}
              </Button>
            </form>

            {/* Social Logins for Customers */}
            <SocialAuthButtons isLoading={isLoading} role={activeTab} />
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Forgot Password"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          {forgotPasswordNotice ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{forgotPasswordNotice}</span>
            </div>
          ) : (
            <p className="text-secondaryText leading-relaxed font-medium">
              Enter your account email address and we'll send you a link to reset your password.
            </p>
          )}

          {forgotPasswordError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{forgotPasswordError}</span>
            </div>
          )}

          {!forgotPasswordNotice && (
            <Input
              label="Email Address"
              type="email"
              placeholder="user@company.com"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              disabled={isSendingReset}
            />
          )}

          <div className="flex items-center gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsForgotPasswordOpen(false)}
            >
              {forgotPasswordNotice ? 'Close' : 'Cancel'}
            </Button>
            {!forgotPasswordNotice && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isSendingReset}
                onClick={handleSendResetLink}
              >
                Send Reset Link
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};