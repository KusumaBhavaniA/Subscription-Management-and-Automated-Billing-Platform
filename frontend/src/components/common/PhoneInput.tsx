import React, { useRef, useState } from 'react';
import { Phone, AlertCircle } from 'lucide-react';

export interface CountryOption {
  code: string;
  country: string;
  flag: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
];

export interface PhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  error,
  helperText,
  label = 'Phone Number',
  required = false,
}) => {
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [isTouched, setIsTouched] = useState(false);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCountryCodeChange(e.target.value);
    // Automatically focus phone input field after selecting country code
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Strip all non-digit characters and enforce max 10 digits
    const cleanedDigits = rawVal.replace(/\D/g, '').slice(0, 10);
    onPhoneChange(cleanedDigits);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanedDigits = pastedText.replace(/\D/g, '').slice(0, 10);
    onPhoneChange(cleanedDigits);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  // Determine validation error message (on blur or when passed externally)
  const validationError =
    error ||
    (isTouched && phone.length > 0 && phone.length < 10
      ? 'Please enter a valid 10-digit mobile number.'
      : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Dedicated Country Code Selector (80-100px fixed width, no overlapping icon) */}
        <div className="relative shrink-0 w-[95px]">
          <select
            value={countryCode}
            onChange={handleCountryChange}
            className="w-full px-2.5 py-2.5 bg-input border border-border rounded-xl text-xs font-bold text-heading focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer transition-colors"
            title="Select Country Code"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>

        {/* Clean Separate Phone Number Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3.5 top-3 w-4 h-4 text-mutedText" />
          <input
            ref={phoneInputRef}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter mobile number"
            value={phone}
            onChange={handlePhoneInputChange}
            onPaste={handlePaste}
            onBlur={handleBlur}
            required={required}
            className={`w-full pl-10 pr-4 py-2.5 bg-input border rounded-xl text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 transition-colors ${
              validationError
                ? 'border-danger focus:ring-danger/25 focus:border-danger'
                : 'border-border focus:ring-primary/25 focus:border-primary'
            }`}
          />
        </div>
      </div>

      {/* Helper Text or Validation Error */}
      {validationError ? (
        <p className="text-[11px] text-danger font-bold flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{validationError}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-mutedText font-medium mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
