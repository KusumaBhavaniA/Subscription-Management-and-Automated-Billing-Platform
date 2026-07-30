import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorkspaceSettings, DEFAULT_SETTINGS } from '../types/settings';
import { STORAGE_KEYS, getItem, setItem } from '../utils/storage';

export const ACCENT_COLORS = {
  blue: { primary: '#2563EB', primaryHover: '#1D4ED8' },
  indigo: { primary: '#4F46E5', primaryHover: '#4338CA' },
  purple: { primary: '#9333EA', primaryHover: '#7E22CE' },
  green: { primary: '#059669', primaryHover: '#047857' },
};

export const FONT_SIZES = {
  small: '14px',
  medium: '15px',
  large: '16px',
};

export const applyAppearance = (
  accentColor: 'blue' | 'indigo' | 'purple' | 'green',
  fontSize: 'small' | 'medium' | 'large' = 'large'
) => {
  const root = document.documentElement;

  // Apply Accent Color CSS variables dynamically
  const accent = ACCENT_COLORS[accentColor] || ACCENT_COLORS.indigo;
  root.style.setProperty('--primary', accent.primary);
  root.style.setProperty('--primary-hover', accent.primaryHover);

  // Apply Large Font Size (16px) by default
  const sizePx = FONT_SIZES[fontSize] || FONT_SIZES.large;
  root.style.fontSize = sizePx;
  root.setAttribute('data-font-size', fontSize);
};

interface SettingsContextType {
  settings: WorkspaceSettings;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => void;
  saveSettings: (newSettings: WorkspaceSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    return getItem<WorkspaceSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  });

  useEffect(() => {
    if (settings.appearance) {
      applyAppearance(settings.appearance.accentColor, settings.appearance.fontSize);
    }
  }, [settings.appearance]);

  const saveSettings = (newSettings: WorkspaceSettings) => {
    setSettings(newSettings);
    setItem(STORAGE_KEYS.SETTINGS, newSettings);
    if (newSettings.appearance) {
      applyAppearance(newSettings.appearance.accentColor, newSettings.appearance.fontSize);
    }
  };

  const updateSettings = (partial: Partial<WorkspaceSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...partial,
        appearance: {
          ...prev.appearance,
          ...(partial.appearance || {}),
        },
        notifications: {
          ...prev.notifications,
          ...(partial.notifications || {}),
        },
        security: {
          ...prev.security,
          ...(partial.security || {}),
        },
      };
      setItem(STORAGE_KEYS.SETTINGS, updated);
      if (updated.appearance) {
        applyAppearance(updated.appearance.accentColor, updated.appearance.fontSize);
      }
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
