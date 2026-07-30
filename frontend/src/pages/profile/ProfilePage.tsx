import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Save, ShieldCheck, Calendar, BookmarkCheck, Hash } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const customerId = user?.customerId || 'CUS-2026-000124';
  const registrationDate = user?.registrationDate || '28 July 2026';
  const currentPlan = user?.currentPlan || 'Starter';
  const subscriptionStatus = user?.subscriptionStatus || 'Active';
  const accountStatus = user?.status || 'Verified';

  const [firstName, setFirstName] = useState(user?.firstName || user?.fullName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.lastName || user?.fullName.split(' ').slice(1).join(' ') || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '+91 9876543210');
  const [country] = useState(user?.country || 'India');
  const [showToast, setShowToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    updateUser({
      firstName,
      lastName,
      fullName,
      phoneNumber: phone,
      themePreference: theme,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-primary" />
          Customer Profile & Account Details
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          Manage your personal information, contact numbers, customer ID, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <Card className="flex flex-col items-center text-center p-6 space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-primary text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            {user?.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <h3 className="text-base font-bold text-heading">{user?.fullName}</h3>
            <p className="text-xs text-secondaryText">{user?.email}</p>
          </div>

          <div className="w-full pt-3 border-t border-border space-y-2 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-mutedText flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                Customer ID:
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
                Current Plan:
              </span>
              <span className="font-bold text-heading">{currentPlan}</span>
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
        <Card className="md:col-span-2 p-6 space-y-4">
          <h3 className="text-sm font-bold text-heading pb-2 border-b border-border">
            Personal Information & Preferences
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Customer ID (Readonly) */}
            <Input
              label="Customer ID"
              value={customerId}
              disabled
              helperText="Unique permanent customer identifier"
              leftIcon={<Hash className="w-4 h-4" />}
            />

            {/* First Name & Last Name */}
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
              helperText="Contact system administrator to modify email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="Country"
                value={country}
                disabled
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border text-xs">
              <div>
                <span className="block text-mutedText font-bold mb-1">Registration Date</span>
                <p className="font-bold text-heading">{registrationDate}</p>
              </div>

              <div>
                <span className="block text-mutedText font-bold mb-1">Subscription Status</span>
                <Badge variant="success">{subscriptionStatus}</Badge>
              </div>

              <div>
                <span className="block text-mutedText font-bold mb-1">Theme Preference</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl border border-border bg-input text-primaryText font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Toast
        isVisible={showToast}
        message="Customer Profile updated successfully."
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
