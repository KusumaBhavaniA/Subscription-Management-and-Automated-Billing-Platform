/**
 * Validates Mobile Numbers with international country code support (+91, +1, +44, etc.)
 */
export const validateMobileNumber = (phone: string, phoneCode?: string): boolean => {
  const sanitized = phone.replace(/[\s\-\+\(\)]/g, '');
  if (!sanitized) return false;
  // Valid phone numbers are numeric and between 7 and 15 digits long
  return /^\d{7,15}$/.test(sanitized);
};

export const validateIndianMobile = (phone: string): boolean => {
  const sanitized = phone.replace(/[\s\-\+\(\)]/g, '');
  const tenDigits = sanitized.length > 10 ? sanitized.slice(-10) : sanitized;
  const regex = /^[6-9]\d{9}$/;
  return regex.test(tenDigits);
};

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Too Weak' | 'Weak' | 'Medium' | 'Strong';
  color: string;
  percentage: number;
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, label: 'Too Weak', color: 'bg-slate-500', percentage: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-red-500', percentage: 25 };
    case 2:
      return { score: 2, label: 'Medium', color: 'bg-amber-500', percentage: 50 };
    case 3:
      return { score: 3, label: 'Medium', color: 'bg-yellow-500', percentage: 75 };
    case 4:
      return { score: 4, label: 'Strong', color: 'bg-emerald-500', percentage: 100 };
    default:
      return { score: 0, label: 'Too Weak', color: 'bg-red-600', percentage: 10 };
  }
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
