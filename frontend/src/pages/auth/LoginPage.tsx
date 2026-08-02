import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, UserCheck, AlertCircle, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BPLogo } from '../../components/common/BPLogo';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole>('Customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = (location.state as any)?.message;

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setError(null);
    setIsUnverified(false);
    setEmail('');
    setPassword('');
  };

  const validateEmailFormat = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);

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

    setIsLoading(true);

    try {
      const session = await login(email, password, activeTab);
      if (session.user.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      setError(msg);
      if (msg.toLowerCase().includes('verify your email')) {
        setIsUnverified(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 bg-background text-primaryText relative overflow-hidden selection:bg-primary selection:text-white transition-colors duration-200">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md space-y-4 z-10 my-auto"
      >
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center mb-0.5">
            <BPLogo size="lg" className="shadow-xl shadow-indigo-600/30" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-heading">
            Billing Platform
          </h1>
          <p className="text-xs text-secondaryText font-medium">
            Smart Subscription & Billing Management System
          </p>
        </div>

        {/* Success Banner if redirected from verification */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-success-bg border border-success-border text-success-text text-xs font-semibold text-center shadow-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Centered Glass Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 shadow-xl border border-border bg-card">
          {/* ROLE SELECTOR TABS */}
          <div className="grid grid-cols-2 p-1.5 mb-4 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 border border-border gap-1.5">
            <button
              type="button"
              onClick={() => handleTabChange('Customer')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'Customer'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#DBEAFE] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('Admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'Admin'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#DBEAFE] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-danger-bg border border-danger-border text-danger-text text-xs space-y-1.5 font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                    <span>{error}</span>
                  </div>
                  {isUnverified && (
                    <button
                      type="button"
                      onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
                      className="w-full mt-1 px-3 py-1 rounded-lg bg-danger text-white font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-colors text-[11px]"
                    >
                      <span>Verify Email Now</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email + Password — same fields for both roles */}

            <Input
              label="Email Address"
              type="email"
              placeholder={activeTab === 'Admin' ? 'admin@billingplatform.com' : 'user@company.com'}
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
            <div className="flex items-center justify-between text-xs pt-0.5">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-secondaryText font-semibold hover:text-primary hover:underline transition-colors cursor-pointer"
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
              className="w-full mt-1 py-2.5"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In as {activeTab}
            </Button>
          </form>

          {/* SOCIAL LOGIN (OAuth 2.0) — Customer accounts only */}
          <SocialAuthButtons isLoading={isLoading} role={activeTab} />
        </div>

        {/* Demo Credentials Notice */}
        <div className="text-center bg-card p-2.5 rounded-xl border border-border shadow-sm">
          <p className="text-[11px] text-secondaryText font-medium">
            Demo Admin: <code className="text-heading font-bold bg-secondary px-1.5 py-0.5 rounded">admin@billingplatform.com</code> | Pass: <code className="text-heading font-bold bg-secondary px-1.5 py-0.5 rounded">Admin@123</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
