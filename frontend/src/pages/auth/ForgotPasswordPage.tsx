import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BPLogo } from '../../components/common/BPLogo';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { forgotPassword } = useAuth();

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-primaryText relative overflow-hidden selection:bg-primary selection:text-white transition-colors duration-200">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md space-y-6 z-10 my-8"
      >
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-secondaryText hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
          <div className="flex items-center gap-2">
            <BPLogo size="sm" />
            <span className="font-bold text-sm text-heading">Billing Platform</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border border-border bg-card space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-heading">
              Forgot Password?
            </h1>
            <p className="text-xs text-secondaryText font-medium max-w-xs mx-auto">
              Enter your registered email address and we'll send you a password reset link.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Success state */}
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-success-bg border border-success-border text-success-text text-sm font-semibold flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Check your inbox</p>
                    <p className="text-xs font-normal mt-0.5 text-success-text/80">
                      If <span className="font-bold">{email}</span> is registered and verified,
                      you'll receive a reset link within a few minutes.
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs text-secondaryText font-medium">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    onClick={() => { setSubmitted(false); setEmail(''); }}
                    className="font-bold text-primary hover:underline transition-colors"
                  >
                    Try again
                  </button>
                </p>

                <Link
                  to="/login"
                  className="block w-full text-center text-xs font-bold text-secondaryText hover:text-primary transition-colors pt-1"
                >
                  ← Back to Login
                </Link>
              </motion.div>
            ) : (
              /* Form state */
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-danger-bg border border-danger-border text-danger-text text-xs flex items-center gap-2 font-semibold"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full py-2.5"
                  isLoading={isLoading}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Send Reset Link
                </Button>

                <p className="text-center text-xs text-secondaryText font-medium pt-1">
                  Remembered your password?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-primary hover:underline transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
