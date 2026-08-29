import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, CreditCard, Layers, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const PaymentFailedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as {
    failureReason?: string;
    planName?: string;
    billingCycle?: string;
    amount?: number;
  } | null;

  const failureReason =
    locationState?.failureReason || 'Bank Timeout - The issuing bank server did not respond in time.';

  const isAuthError =
    failureReason.toLowerCase().includes('session has expired') ||
    failureReason.toLowerCase().includes('log in again') ||
    failureReason.includes('401') ||
    failureReason.toLowerCase().includes('unauthorized');

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <Card className="p-8 text-center space-y-6 border border-danger/30 shadow-2xl bg-card relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

        {/* Warning Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-danger/10 border-2 border-danger/40 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-danger" />
        </div>

        <div className="space-y-2">
          <Badge variant="danger" className="mx-auto">
            {isAuthError ? 'Session Expired' : 'Payment Failed'}
          </Badge>
          <h1 className="text-2xl font-black text-heading">
            {isAuthError ? 'Authentication Required' : 'Transaction Could Not Be Processed'}
          </h1>
          <p className="text-xs text-secondaryText max-w-md mx-auto">
            {isAuthError
              ? 'Your session has expired. Please log in again to complete your payment.'
              : 'We were unable to complete your payment. No charges were made to your account.'}
          </p>
        </div>

        {/* Failure Reason Card */}
        <div className="p-5 rounded-2xl bg-danger/5 border border-danger/20 text-xs text-left space-y-2">
          <span className="font-extrabold text-danger uppercase tracking-wider text-[10px] block">
            {isAuthError ? 'Authentication Status' : 'Failure Reason'}
          </span>
          <p className="text-xs font-semibold text-heading leading-relaxed">{failureReason}</p>
          <p className="text-[11px] text-secondaryText mt-1">
            {isAuthError
              ? 'Your security token is missing or expired. Logging in again will generate a new valid authentication session.'
              : 'Common causes include temporary bank downtime, incorrect card credentials, or network timeouts.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          {isAuthError ? (
            <Button
              variant="primary"
              className="w-full sm:w-auto px-8"
              onClick={() => navigate('/login')}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Log In Again
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => navigate('/customer/payment')}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Retry Payment
              </Button>

              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => navigate('/customer/payment')}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                Change Payment Method
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate('/customer/plans')}
                leftIcon={<Layers className="w-4 h-4" />}
              >
                Return to Plans
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
