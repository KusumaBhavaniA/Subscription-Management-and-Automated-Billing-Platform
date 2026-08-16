import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { authApi } from '../../services/api/authApi';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { acceptSession } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');

      try {
        if (!token) throw new Error('Missing authentication token.');
        const response = await authApi.getMe(token);
        if (!response.success || !response.data) throw new Error(response.error || response.message);

        acceptSession({ token, user: response.data });
        if (response.data.role === 'Admin') {
          navigate('/admin/dashboard');
        } else if (!response.data.phoneNumber || !response.data.phoneNumber.trim()) {
          navigate('/profile?completeMobile=true', {
            state: { message: 'Authentication successful. Please enter your mobile number to complete profile registration.' },
          });
        } else {
          navigate('/customer/dashboard');
        }
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, acceptSession, navigate]);

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
