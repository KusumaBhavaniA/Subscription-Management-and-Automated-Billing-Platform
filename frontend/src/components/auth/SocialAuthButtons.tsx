import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api/authApi';

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
      navigate('/customer/dashboard');
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

      <div className="grid grid-cols-3 gap-2.5">
        {/* Google */}
        <button
          type="button"
          disabled={isLoading || !!socialLoading}
          onClick={() => handleSocialAuth('Google')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-primaryText text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          {socialLoading === 'Google' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span className="hidden sm:inline">Google</span>
        </button>

        {/* Microsoft */}
        <button
          type="button"
          disabled={isLoading || !!socialLoading}
          onClick={() => handleSocialAuth('Microsoft')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-primaryText text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          {socialLoading === 'Microsoft' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
          )}
          <span className="hidden sm:inline">Microsoft</span>
        </button>

        {/* Apple */}
        <button
          type="button"
          disabled={isLoading || !!socialLoading}
          onClick={() => handleSocialAuth('Apple')}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-primaryText text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          {socialLoading === 'Apple' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          ) : (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.92-14.4-6.15-3.63-2.94-7.58-7.7-11.85-14.28-6.02-9.28-10.9-19.68-14.65-31.2-3.75-11.53-5.63-22.37-5.63-32.53 0-15.12 3.84-27.42 11.53-36.9 7.68-9.48 17.27-14.31 28.77-14.5 4.58 0 9.77 1.2 15.57 3.59 5.8 2.39 9.87 3.63 12.2 3.73 2.12 0 6.37-1.3 12.74-3.9 6.37-2.6 11.75-3.8 16.14-3.59 12.06.67 21.6 5.17 28.63 13.5-10.82 6.53-16.08 15.66-15.79 27.39.29 9.17 3.86 16.8 10.72 22.89 6.86 6.09 15.02 9.53 24.48 10.33-2.22 6.72-5.1 13.62-8.65 20.7zM119.22 31.84c0-7.39 2.7-14.47 8.11-21.24 5.4-6.77 12.15-10.6 20.24-11.5 0.2 1.34 0.3 2.5 0.3 3.49 0 7.31-2.65 14.38-7.95 21.2-5.3 6.83-12.18 10.78-20.65 11.86-0.03-1.02-0.05-2.29-0.05-3.81z" />
            </svg>
          )}
          <span className="hidden sm:inline">Apple</span>
        </button>
      </div>
    </div>
  );
};
