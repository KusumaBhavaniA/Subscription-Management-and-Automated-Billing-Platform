import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, ShieldX } from 'lucide-react';
import { authService } from '../../services/authService';
import { checkPasswordStrength } from '../../utils/validators';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BPLogo } from '../../components/common/BPLogo';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const passwordStrength = checkPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (passwordStrength.score < 2) {
      setError('Password is too weak. Include uppercase letters, numbers, and symbols.');
      return;
    }
    if (!token) {
      setError('This reset link is invalid or missing a token.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.resetPassword(token, newPassword);
      if (!response?.success) {
        throw new Error(response?.error || response?.message || 'Failed to reset password.');
      }
      setIsDone(true);
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Your password has been reset. Please sign in with your new password.' },
        });
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'This reset link is invalid or has expired. Please request a new one.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // No token at all in the URL — the link was malformed or opened without one
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-primaryText">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6 text-center"
        >
          <div className="glass-card rounded-2xl p-8 shadow-xl border border-border bg-card space-y-4">
            <ShieldX className="w-10 h-10 text-danger mx-auto" />
            <h2 className="text-lg font-extrabold text-heading">Invalid Reset Link</h2>
            <p className="text-xs text-secondaryText font-medium leading-relaxed">
              This password reset link is missing or malformed. Please request a new one from the login page.
            </p>
            <Link to="/login">
              <Button variant="primary" size="sm" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-primaryText relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm space-y-6 z-10"
      >
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
            <span className="font-bold text-sm text-heading">NexFlow</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border border-border bg-card">
          {isDone ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
              <h2 className="text-lg font-extrabold text-heading">Password Reset</h2>
              <p className="text-xs text-secondaryText font-medium">
                Your password has been updated. Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-extrabold text-heading">Create New Password</h2>
                <p className="text-xs text-secondaryText font-medium">
                  Choose a strong new password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger-text text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                    <span>{error}</span>
                  </div>
                )}

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
                  error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full py-2.5 mt-2"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};