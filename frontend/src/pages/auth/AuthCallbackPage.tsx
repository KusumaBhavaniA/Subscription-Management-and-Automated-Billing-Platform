import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socialLogin } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const providerParam = searchParams.get('provider') as 'Google' | 'Microsoft' | 'Apple' | null;
      const provider = providerParam || 'Google';

      try {
        const session = await socialLogin(provider);
        if (session.user.role === 'Admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-primaryText">
      <Card className="p-8 text-center max-w-sm w-full space-y-4 border border-border shadow-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-heading">Authenticating Session</h3>
          <p className="text-xs text-secondaryText">Verifying identity token with backend provider...</p>
        </div>
      </Card>
    </div>
  );
};
