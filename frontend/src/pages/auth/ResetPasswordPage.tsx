import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { checkPasswordStrength } from '../../utils/validators';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BPLogo } from '../../components/common/BPLogo';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = checkPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Include uppercase letters, numbers, and symbols.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successfully. You can now sign in with your new password.' },
        });
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // Guard: no token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-primaryText">
        <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-xl border border-border bg-card text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-danger/10 border border-danger/20 mb-1">
            <AlertCircle className="w-6 h-6 text-danger" />
          </div>
          <h1 className="text-xl font-extrabold text-heading">Invalid Reset Link</h1>
          <p className="text-xs text-secondaryText font-medium">
            This password reset link is invalid or has already been used.
            Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block mt-2 text-sm font-bold text-primary hover:underline transition-colors"
          >
            Request New Link →
          </Link>
        </div>
      </div>
    );
  }

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
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-heading">
              Reset Password
            </h1>
            <p className="text-xs text-secondaryText font-medium max-w-xs mx-auto">
              Choose a strong new password for your account.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              /* Success state */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-success-bg border border-success-border text-success-text text-sm font-semibold flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Password reset successfully!</p>
                    <p className="text-xs font-normal mt-0.5 text-success-text/80">
                      Redirecting you to the login page…
                    </p>
                  </div>
                </div>
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

                <div className="space-y-1.5">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                  />

                  {newPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-secondaryText font-medium">Password Strength:</span>
                        <span className="font-bold text-heading">{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={
                    confirmPassword && newPassword !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full py-2.5"
                  isLoading={isLoading}
                  rightIcon={<KeyRound className="w-4 h-4" />}
                >
                  Reset Password
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
