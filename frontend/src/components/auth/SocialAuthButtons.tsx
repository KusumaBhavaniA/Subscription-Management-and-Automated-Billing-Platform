import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api/authApi';
import { ENABLED_OAUTH_PROVIDERS } from '../../config/authConfig';

interface SocialAuthButtonsProps {
  isLoading?: boolean;
  /** Only 'Customer' accounts may use social login. Pass activeTab role here. */
  role?: 'Customer' | 'Admin';
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ isLoading, role = 'Customer' }) => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Admin accounts must NEVER use social login.
  // Social authentication is strictly restricted to Customer accounts.
  if (role === 'Admin') return null;

  const handleSocialAuth = async (provider: 'Google' | 'Microsoft' | 'Apple') => {
    if (!ENABLED_OAUTH_PROVIDERS[provider]) return;

    setSocialLoading(provider);
    try {
      // 1. Try redirecting to official Backend OAuth endpoint GET /auth/{provider}/login
      const backendOAuthUrl = authApi.getOAuthLoginUrl(provider);
      window.location.assign(backendOAuthUrl);
      return;

      // Check if backend responds with redirect or 200
      try {
        const res = await fetch(backendOAuthUrl, { method: 'HEAD', redirect: 'follow' });
        if (res.ok || res.redirected) {
          window.location.href = backendOAuthUrl;
          return;
        }
      } catch {
        // Fallback to seamless client-side OAuth flow
      }

      // 2. Perform OAuth session creation & Customer account registration.
      // Backend must determine role — frontend never elevates privileges.
      const session = await socialLogin(provider);
      if (session.user.role === 'Admin') {
        // Safety guard: social login must never authenticate Admin accounts.
        console.warn('Social login returned Admin role — access denied.');
        navigate('/login');
        return;
      }
      if (!session.user.phoneNumber || !session.user.phoneNumber?.trim()) {
        navigate('/profile?completeMobile=true', {
          state: {
            message: 'Google login successful. Please enter your mobile number to complete your profile setup.',
          },
        });
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      console.error('OAuth Authentication failed:', err);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <span className="relative px-3 bg-card text-[10px] uppercase font-bold text-mutedText tracking-wider">
          Or Continue With
        </span>
      </div>

      <div>
        {/* Google */}
        <button
          type="button"
          disabled={isLoading || !!socialLoading || !ENABLED_OAUTH_PROVIDERS.Google}
          onClick={() => handleSocialAuth('Google')}
          title={ENABLED_OAUTH_PROVIDERS.Google ? 'Sign in with Google' : 'Google login coming soon'}
          className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-border bg-secondary/60 text-primaryText text-xs font-bold transition-all ${
            ENABLED_OAUTH_PROVIDERS.Google
              ? 'hover:bg-secondary cursor-pointer disabled:opacity-50'
              : 'cursor-not-allowed opacity-60'
          }`}
        >
          {socialLoading === 'Google' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google</span>
          {!ENABLED_OAUTH_PROVIDERS.Google && (
            <span className="text-[9px] font-normal text-mutedText whitespace-nowrap">(Coming Soon)</span>
          )}
        </button>
      </div>
    </div>
  );
};
