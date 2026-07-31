import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, ArrowLeft, ArrowRight, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateIndianMobile, checkPasswordStrength } from '../../utils/validators';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BPLogo } from '../../components/common/BPLogo';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { PhoneInput } from '../../components/common/PhoneInput';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country] = useState('India');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = checkPasswordStrength(password);

  const validateEmailFormat = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (!validateEmailFormat(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Include uppercase letters, numbers, and symbols.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await register({
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        password,
        confirmPassword,
        country,
        phoneCode,
        acceptTerms,
      });

      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`, {
        state: {
          email: res.email,
          message: "We've sent a verification code to your email.",
        },
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-primaryText relative overflow-hidden selection:bg-primary selection:text-white transition-colors duration-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg space-y-6 z-10 my-8"
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
            <span className="font-bold text-sm text-heading">Billing Platform</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border border-border bg-card">
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-extrabold text-heading">Create Customer Account</h2>
            <p className="text-xs text-secondaryText font-medium">
              Smart Subscription & Billing Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger-text text-xs flex items-center gap-2 font-semibold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                placeholder="Rohan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Last Name"
                type="text"
                placeholder="Sharma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="rohan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            {/* Dedicated Modern Phone Number Input */}
            <PhoneInput
              countryCode={phoneCode}
              onCountryCodeChange={setPhoneCode}
              phone={phone}
              onPhoneChange={setPhone}
              helperText="10-digit mobile number for SMS verification & updates"
              required
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              {password && (
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
              label="Confirm Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              required
            />

            {/* Accept Terms Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAcceptTerms(!acceptTerms)}
                className="mt-0.5 text-primary focus:outline-none shrink-0 cursor-pointer"
              >
                {acceptTerms ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-mutedText" />
                )}
              </button>
              <label
                onClick={() => setAcceptTerms(!acceptTerms)}
                className="text-xs text-secondaryText font-medium cursor-pointer selection:bg-none"
              >
                I agree to the{' '}
                <span className="font-bold text-primary hover:underline">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="font-bold text-primary hover:underline">
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-2.5 mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          {/* SOCIAL REGISTRATION */}
          <SocialAuthButtons isLoading={isLoading} />
        </div>
      </motion.div>
    </div>
  );
};
