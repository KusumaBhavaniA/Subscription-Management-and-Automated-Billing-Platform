import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, KeyRound, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { BPLogo } from '../../components/common/BPLogo';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || (location.state as any)?.email || '';
  const initialNotice = (location.state as any)?.message || "We've sent a verification code to your email address. Please check your inbox.";

  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(initialNotice);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];

    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < digits.length; i++) {
      newDigits[i] = digits[i];
    }
    setOtpDigits(newDigits);
    const lastIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter all six digits of the verification code.');
      return;
    }

    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    setIsVerifying(true);

    try {
      await verifyOTP(email, fullOtp);
      
      const welcomeMsg = 'Welcome! Your account has been verified successfully.';
      setSuccessMsg(welcomeMsg);

      setTimeout(() => {
        navigate('/login', {
          state: { message: welcomeMsg },
        });
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address to resend the code.');
      return;
    }
    if (timeLeft > 0) return;

    setError(null);
    setIsResending(true);

    try {
      await resendOTP(email);
      setTimeLeft(60);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMsg('A new verification code has been sent to your email address.');
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-primaryText relative overflow-hidden selection:bg-primary selection:text-white transition-colors duration-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6 z-10 my-8"
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

        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border border-border bg-card space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-1">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-heading">
              Verify Email Address
            </h1>
            <p className="text-xs text-secondaryText font-medium max-w-xs mx-auto">
              Please enter the 6-digit verification code sent to your email.
            </p>
            {email ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-bold text-heading mt-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>{email}</span>
              </div>
            ) : (
              <div className="pt-2">
                <input
                  type="email"
                  placeholder="Enter your registered email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-input text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
            )}
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger-text text-xs flex items-center gap-2 font-semibold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primaryText text-xs flex items-start gap-2.5 font-medium leading-relaxed shadow-sm"
                >
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 6 Individual OTP Input Boxes */}
            <div>
              <label className="block text-xs font-bold text-secondaryText text-center mb-3 uppercase tracking-wider">
                Verification Code
              </label>
              <div className="flex items-center justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center font-mono text-xl font-bold rounded-xl border border-border bg-input text-primaryText focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>

            {/* 60-Second Countdown & Resend Section */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-secondaryText font-medium">
                <span>Resend in:</span>
                <span className={`font-bold font-mono ${timeLeft > 0 ? 'text-primary' : 'text-mutedText'}`}>
                  {formatTimer(timeLeft)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={timeLeft > 0 || isResending}
                className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isVerifying}
              rightIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Verify Account
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-secondaryText hover:text-primaryText transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
