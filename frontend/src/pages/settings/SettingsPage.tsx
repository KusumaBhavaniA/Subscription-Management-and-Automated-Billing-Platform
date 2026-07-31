import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Save,
  Bell,
  Shield,
  Globe,
  Sun,
  Moon,
  Palette,
  UserCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Toast } from '../../components/common/Toast';
import { useSettings } from '../../hooks/useSettings';
import { applyAppearance } from '../../contexts/SettingsContext';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { WorkspaceSettings } from '../../types/settings';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'security' | 'profile' | 'billing';

export const SettingsPage: React.FC = () => {
  const { settings, saveSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setIsDirty, registerSaveHandler, registerDiscardHandler, requestNavigation } = useUnsavedChanges();

  const savedSettingsRef = useRef<WorkspaceSettings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [formState, setFormState] = useState<WorkspaceSettings>(settings);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Compute dirty state
  const isDirty = JSON.stringify(formState) !== JSON.stringify(savedSettingsRef.current);

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  const performSave = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      saveSettings(formState);
      savedSettingsRef.current = formState;

      // Apply theme & accent
      setTheme(formState.appearance.theme);
      applyAppearance(formState.appearance.accentColor, formState.appearance.fontSize);

      setIsDirty(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return true;
    } catch (err) {
      console.error('Failed to save preferences:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formState, saveSettings, setTheme, setIsDirty]);

  const performDiscard = useCallback(() => {
    const original = savedSettingsRef.current;
    setFormState(original);
    setTheme(original.appearance.theme);
    applyAppearance(original.appearance.accentColor, original.appearance.fontSize);
    setIsDirty(false);
  }, [setTheme, setIsDirty]);

  useEffect(() => {
    registerSaveHandler(performSave);
    registerDiscardHandler(performDiscard);
    return () => {
      registerSaveHandler(null);
      registerDiscardHandler(null);
      setIsDirty(false);
    };
  }, [registerSaveHandler, registerDiscardHandler, performSave, performDiscard, setIsDirty]);

  const currencyOptions = [
    { value: 'INR (₹)', label: 'Indian Rupee (INR ₹)' },
    { value: 'USD ($)', label: 'United States Dollar (USD $)' },
    { value: 'EUR (€)', label: 'Euro (EUR €)' },
    { value: 'GBP (£)', label: 'British Pound (GBP £)' },
  ];

  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: '(GMT+05:30) Asia/Kolkata (IST)' },
    { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
    { value: 'Europe/London', label: '(GMT+00:00) London, Edinburgh' },
    { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore' },
  ];


  // Application-managed formatting defaults (not user-configurable):
  // Date Format: DD/MM/YYYY | Number Format: Indian Numbering System (₹1,00,000)



  const handleToggleNotification = (key: keyof WorkspaceSettings['notifications']) => {
    setFormState((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleToggleSecurity = (key: keyof WorkspaceSettings['security']) => {
    setFormState((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: !prev.security[key],
      },
    }));
  };

  const handleThemeChange = (newTheme: Theme) => {
    setFormState((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: newTheme,
      },
    }));
  };

  const handleAccentChange = (accent: 'blue' | 'indigo' | 'purple' | 'green') => {
    setFormState((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        accentColor: accent,
      },
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    performSave();
  };

  const handleRestoreDefaults = () => {
    const defaults: WorkspaceSettings = {
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'Indian',
      notifications: {
        emailNotifications: true,
        billingAlerts: true,
        invoiceAlerts: true,
        subscriptionRenewalAlerts: true,
        securityAlerts: true,
      },
      appearance: {
        theme: 'light',
        accentColor: 'blue',
        fontSize: 'medium',
      },
      security: {
        twoFactor: false,
        sessionTimeout: true,
      },
    };
    setFormState(defaults);
    setTheme('light');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Globe className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Configure application appearance, notifications, security, and workspace preferences.
          </p>
        </div>
      </div>

      {/* Navigation Sections Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border no-scrollbar">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-secondaryText hover:text-primaryText hover:bg-secondary'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveForm} className="space-y-6">
        {/* APPEARANCE SECTION */}
        {activeTab === 'appearance' && (
          <Card className="w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-heading flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Appearance & Theme Settings
                </h2>
                <p className="text-xs text-secondaryText mt-0.5">
                  Customize theme modes and color schemes.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleThemeChange('light');
                  handleAccentChange('blue');
                }}
              >
                Reset Theme
              </Button>
            </div>

            {/* Theme Options: ○ Light  ○ Dark */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText">
                Theme Options
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Option */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                    formState.appearance.theme === 'light'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-card hover:border-borderHover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      formState.appearance.theme === 'light' ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {formState.appearance.theme === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-heading">Light Mode</h3>
                    <p className="text-[11px] text-secondaryText mt-0.5 font-medium">
                      Clean, high-contrast light background (Default)
                    </p>
                  </div>
                </button>

                {/* Dark Option */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                    formState.appearance.theme === 'dark'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-card hover:border-borderHover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      formState.appearance.theme === 'dark' ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {formState.appearance.theme === 'dark' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-heading">Dark Mode</h3>
                    <p className="text-[11px] text-secondaryText mt-0.5 font-medium">
                      Sleek low-light theme for comfortable viewing
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Accent Color Section */}
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondaryText">
                Accent Color
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'blue', name: 'Blue', color: 'bg-blue-600' },
                  { id: 'indigo', name: 'Indigo', color: 'bg-indigo-600' },
                  { id: 'purple', name: 'Purple', color: 'bg-purple-600' },
                  { id: 'green', name: 'Green', color: 'bg-emerald-600' },
                ].map((item) => {
                  const isSelected = formState.appearance.accentColor === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAccentChange(item.id as any)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-secondary ring-2 ring-primary/30'
                          : 'border-border bg-card hover:bg-secondary'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${item.color} shrink-0 shadow-sm`} />
                      <span className="text-primaryText">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* NOTIFICATIONS SECTION */}
        {activeTab === 'notifications' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <Bell className="w-5 h-5 text-success" />
              <div>
                <h2 className="text-base font-bold text-heading">Notification Preferences</h2>
                <p className="text-xs text-secondaryText">Manage automated email and system notification alerts.</p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-border">
              <Switch
                label="Email Notifications"
                description="Receive general account updates and operational announcements via email"
                checked={formState.notifications.emailNotifications}
                onChange={() => handleToggleNotification('emailNotifications')}
              />

              <Switch
                label="Billing Alerts"
                description="Get notified of charge updates, subscription modifications, and payment receipts"
                checked={formState.notifications.billingAlerts}
                onChange={() => handleToggleNotification('billingAlerts')}
              />

              <Switch
                label="Invoice Alerts"
                description="Receive automated PDF invoice receipts upon generation and payment"
                checked={formState.notifications.invoiceAlerts}
                onChange={() => handleToggleNotification('invoiceAlerts')}
              />

              <Switch
                label="Subscription Renewal Alerts"
                description="Get reminder emails 3 days prior to recurring plan renewal dates"
                checked={formState.notifications.subscriptionRenewalAlerts}
                onChange={() => handleToggleNotification('subscriptionRenewalAlerts')}
              />

              <Switch
                label="Security Alerts"
                description="Receive immediate alerts for unauthorized sign-ins or password updates"
                checked={formState.notifications.securityAlerts}
                onChange={() => handleToggleNotification('securityAlerts')}
              />
            </div>
          </Card>
        )}

        {/* GENERAL SECTION */}
        {activeTab === 'general' && (
          <Card className="w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-heading">Regional & Formatting Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Select
                label="Default Currency"
                options={currencyOptions}
                value={formState.currency}
                onChange={(e) => setFormState({ ...formState, currency: e.target.value })}
                helperText="Primary currency for billing quotes & invoice generation"
              />

              <Select
                label="Timezone"
                options={timezoneOptions}
                value={formState.timezone}
                onChange={(e) => setFormState({ ...formState, timezone: e.target.value })}
                helperText="Determines recurring subscription billing trigger times"
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRestoreDefaults}
              >
                Restore Defaults
              </Button>
            </div>
          </Card>
        )}

        {/* SECURITY SECTION */}
        {activeTab === 'security' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-heading">Security & Session Rules</h2>
            </div>

            <div className="space-y-4 divide-y divide-border">
              <Switch
                label="Two-Factor Authentication (2FA)"
                description="Require authenticator app verification code on sign in"
                checked={formState.security.twoFactor}
                onChange={() => handleToggleSecurity('twoFactor')}
              />

              <Switch
                label="Session Idle Timeout"
                description="Automatically sign out after 30 minutes of inactivity"
                checked={formState.security.sessionTimeout}
                onChange={() => handleToggleSecurity('sessionTimeout')}
              />
            </div>
          </Card>
        )}

        {/* BILLING SECTION */}
        {activeTab === 'billing' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-heading">Subscription & Billing Method</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-success-bg text-success-text text-xs font-bold border border-success-border">
                Starter Plan Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-secondary border border-border text-xs">
              <div>
                <span className="text-mutedText uppercase font-semibold">Customer ID</span>
                <p className="font-bold font-mono text-heading mt-0.5">{user?.customerId || 'CUS-2026-000124'}</p>
              </div>
              <div>
                <span className="text-mutedText uppercase font-semibold">Next Invoice Date</span>
                <p className="font-bold text-heading mt-0.5">15 August 2026</p>
              </div>
              <div>
                <span className="text-mutedText uppercase font-semibold">Payment Status</span>
                <p className="font-bold text-success mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Good Standing
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Save Button (Disabled if !isDirty) */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>
      </form>

      {/* FLOATING UNSAVED CHANGES BAR */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] shadow-[0_12px_30px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)] text-[#0F172A] dark:text-[#F8FAFC]">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You have unsaved changes</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={performDiscard} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  onClick={performSave}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast
        isVisible={showToast}
        message="Preferences saved successfully."
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
