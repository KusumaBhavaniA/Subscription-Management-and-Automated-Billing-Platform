import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, MapPin, Save, ShieldCheck, Calendar, BookmarkCheck, Hash, Globe, Camera, Lock, CheckCircle2, Link2, Unlink, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PhoneInput } from '../../components/common/PhoneInput';
import { Badge } from '../../components/common/Badge';
import { Toast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { ENABLED_OAUTH_PROVIDERS } from '../../config/authConfig';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const isAdmin = user?.role === 'Admin';
  const customerId = user?.customerId || (isAdmin ? 'ADM-2026-000001' : 'CUS-2026-000124');
  const extractPhoneDetails = (rawPhone?: string) => {
    if (!rawPhone || !rawPhone.trim()) return { code: '+91', number: '' };
    const cleaned = rawPhone.trim();
    const match = cleaned.match(/^(\+\d{1,3})[\s-]*(.*)$/);
    if (match && match[2]) {
      return { code: match[1], number: match[2].trim() };
    }
    if (cleaned.startsWith('+91') && cleaned.length >= 12) {
      return { code: '+91', number: cleaned.slice(3).trim() };
    }
    return { code: '+91', number: cleaned };
  };

  const rawUserPhone = user?.phoneNumber || (user as any)?.phone || (user as any)?.phone_number || '';
  const initialPhoneDetails = extractPhoneDetails(rawUserPhone);

  const registrationDate = user?.registrationDate || '28 July 2026';
  const currentPlan = user?.currentPlan || (isAdmin ? 'System Administrator' : 'Starter');
  const accountStatus = user?.status || 'Verified';

  const isMobileRequiredNotice = searchParams.get('completeMobile') === 'true' || (!rawUserPhone.trim() && !isAdmin);
  const noticeMsg = (location.state as any)?.message || 'Please enter your mobile number to complete your profile setup.';

  const [firstName, setFirstName] = useState(user?.firstName || user?.fullName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.fullName?.split(' ').slice(1).join(' ') || '');
  const [email] = useState(user?.email || '');

  const [phoneCode, setPhoneCode] = useState(initialPhoneDetails.code);
  const [phone, setPhone] = useState(initialPhoneDetails.number || (isAdmin ? '1800-BILLING-ADM' : ''));
  const [address, setAddress] = useState(user?.address || '');
  const [photoUrl, setPhotoUrl] = useState(user?.profilePicture || '');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [country, setCountry] = useState(user?.country || 'India');

  const [linkedProviders, setLinkedProviders] = useState<string[]>(user?.linkedProviders || ['Google']);
  const primaryProvider = user?.authProvider || 'Email & Password';

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Profile preferences updated successfully.');
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const formattedPhone = isAdmin ? user?.phoneNumber : (phone.trim() ? `${phoneCode} ${phone.trim()}` : '');
    updateUser({
      firstName,
      lastName,
      fullName,
      phoneNumber: formattedPhone,
      address,
      profilePicture: photoUrl,
      country,
      themePreference: theme,
    });
    setToastMsg('Profile preferences updated successfully.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleToggleProvider = async (provider: 'Google' | 'Microsoft' | 'Apple') => {
    if (!user) return;
    const isConnected = linkedProviders.includes(provider);

    if (isConnected) {
      if (provider === 'Google') {
        setIsDisconnectModalOpen(true);
        return;
      }
      await authService.unlinkProvider(user.email, provider);
      setLinkedProviders(linkedProviders.filter((p) => p !== provider));
      setToastMsg(`Disconnected ${provider} account.`);
    } else {
      await authService.linkProvider(user.email, provider);
      setLinkedProviders([...linkedProviders, provider]);
      setToastMsg(`Successfully connected ${provider} account.`);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConfirmGoogleDisconnect = async () => {
    if (!user) return;
    setIsDisconnecting(true);
    try {
      await authService.unlinkProvider(user.email, 'Google');
      logout();
      navigate('/login', {
        state: {
          message: 'Google Authentication disconnected successfully. Please login again.',
        },
      });
    } catch (err) {
      setIsDisconnecting(false);
      setIsDisconnectModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-primary" />
          {isAdmin ? 'System Administrator Profile' : 'Customer Account Profile'}
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          {isAdmin
            ? 'Manage administrative identity, system access role, and preferences.'
            : 'Manage personal details, contact phone number, address, and login providers.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <Card className="flex flex-col items-center text-center p-6 space-y-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-primary text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-primary/30 overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
              )}
            </div>
            {!isAdmin && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-heading">{user?.fullName}</h3>
            <p className="text-xs text-secondaryText">{user?.email}</p>
            <div className="mt-1">
              <Badge variant={isAdmin ? 'brand' : 'success'}>{user?.role || 'Customer'}</Badge>
            </div>
          </div>

          <div className="w-full pt-3 border-t border-border space-y-2 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-mutedText flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                ID:
              </span>
              <span className="font-mono font-bold text-heading">{customerId}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-mutedText flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Status:
              </span>
              <Badge variant="success">{accountStatus}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-mutedText flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                Primary Auth:
              </span>
              <Badge variant="brand">{primaryProvider}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-mutedText flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Joined:
              </span>
              <span className="font-semibold text-secondaryText">{registrationDate}</span>
            </div>
          </div>
        </Card>

        {/* Update Profile Form */}
        <Card className="md:col-span-2 p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-heading pb-2 border-b border-border">
              {isAdmin ? 'Administrator Profile Information' : 'Personal & Contact Information'}
            </h3>

            {isMobileRequiredNotice && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-900 dark:text-amber-100">Mobile Number Required</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{noticeMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label={isAdmin ? 'Administrator ID' : 'Customer ID'}
                value={customerId}
                disabled
                helperText="Unique permanent system identifier"
                leftIcon={<Hash className="w-4 h-4" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={email}
                disabled
                helperText="Email changes require security authorization"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              {isAdmin ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider">
                      Admin Phone Number
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Managed by Company
                    </span>
                  </div>
                  <Input
                    value={phone}
                    disabled
                    helperText="Admin phone numbers are managed centrally"
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>
              ) : (
                <PhoneInput
                  countryCode={phoneCode}
                  onCountryCodeChange={setPhoneCode}
                  phone={phone}
                  onPhoneChange={setPhone}
                  label="Mobile Number"
                  helperText="Mandatory contact mobile number for verification and security"
                  required
                />
              )}

              {!isAdmin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Billing Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      leftIcon={<MapPin className="w-4 h-4" />}
                    />

                    <Input
                      label="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      leftIcon={<Globe className="w-4 h-4" />}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Profile Photo URL"
                      placeholder="https://example.com/photo.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      leftIcon={<Camera className="w-4 h-4" />}
                    />

                    <div>
                      <label className="block text-xs font-bold text-secondaryText mb-1.5 uppercase tracking-wider">
                        Preferred Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-border bg-input text-primaryText font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                      >
                        <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata (IST)</option>
                        <option value="America/New_York">(GMT-05:00) Eastern Time (US)</option>
                        <option value="Europe/London">(GMT+00:00) London, UK</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-3">
                <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* SOCIAL LOGIN PROVIDERS MANAGEMENT SECTION */}
          <div className="pt-6 border-t border-border space-y-4">
            <h3 className="text-sm font-bold text-heading">Connected Login Providers</h3>
            <p className="text-xs text-secondaryText">
              Link your social accounts to log in with 1-click single sign-on (OAuth 2.0).
            </p>

            <div className="space-y-3">
              {(['Google', 'Microsoft', 'Apple'] as const).map((prov) => {
                const isConnected = linkedProviders.includes(prov);
                const isEnabled = ENABLED_OAUTH_PROVIDERS[prov];
                return (
                  <div
                    key={prov}
                    className="p-3.5 rounded-xl border border-border bg-secondary/40 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-card border border-border">
                        {prov === 'Google' && (
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          </svg>
                        )}
                        {prov === 'Microsoft' && (
                          <svg className="w-4 h-4" viewBox="0 0 23 23">
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H12z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H12z" />
                          </svg>
                        )}
                        {prov === 'Apple' && (
                          <svg className="w-4 h-4 fill-current text-primaryText" viewBox="0 0 170 170">
                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.92-14.4-6.15-3.63-2.94-7.58-7.7-11.85-14.28-6.02-9.28-10.9-19.68-14.65-31.2-3.75-11.53-5.63-22.37-5.63-32.53 0-15.12 3.84-27.42 11.53-36.9 7.68-9.48 17.27-14.31 28.77-14.5 4.58 0 9.77 1.2 15.57 3.59 5.8 2.39 9.87 3.63 12.2 3.73 2.12 0 6.37-1.3 12.74-3.9 6.37-2.6 11.75-3.8 16.14-3.59 12.06.67 21.6 5.17 28.63 13.5-10.82 6.53-16.08 15.66-15.79 27.39.29 9.17 3.86 16.8 10.72 22.89 6.86 6.09 15.02 9.53 24.48 10.33-2.22 6.72-5.1 13.62-8.65 20.7z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-heading block">{prov} Authentication</span>
                        <span className="text-[10px] text-secondaryText font-medium">
                          {isConnected ? 'Connected & Verified' : isEnabled ? 'Not Connected' : 'Coming Soon'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isEnabled && !isConnected}
                      onClick={() => isEnabled && handleToggleProvider(prov)}
                      title={!isEnabled ? `${prov} integration coming soon` : undefined}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        !isEnabled && !isConnected
                          ? 'bg-secondary text-mutedText cursor-not-allowed opacity-60'
                          : isConnected
                          ? 'border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer'
                          : 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Unlink className="w-3.5 h-3.5" /> Disconnect
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5" /> {isEnabled ? 'Connect' : 'Coming Soon'}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <Toast
        isVisible={showToast}
        message={toastMsg}
        type="success"
        onClose={() => setShowToast(false)}
      />

      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => !isDisconnecting && setIsDisconnectModalOpen(false)}
        title="Disconnect Google Authentication"
        size="md"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-semibold leading-relaxed">
              Disconnecting Google Authentication will remove your Google OAuth provider connection, clear your current session, log you out, and require you to log in again.
            </p>
          </div>
          <p className="text-xs text-secondaryText font-medium">
            Are you sure you want to disconnect Google Authentication?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisconnectModalOpen(false)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmGoogleDisconnect}
              isLoading={isDisconnecting}
            >
              Confirm Disconnect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
