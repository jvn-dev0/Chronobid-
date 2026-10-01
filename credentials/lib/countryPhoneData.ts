import { parsePhoneNumberFromString, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface CountryPhoneInfo {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_PHONE_LIST: CountryPhoneInfo[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
];

export function getCountryByCode(code: string): CountryPhoneInfo {
  const upper = code.toUpperCase();
  return (
    COUNTRY_PHONE_LIST.find(c => c.code === upper) ||
    COUNTRY_PHONE_LIST[0] // Default India
  );
}

export function parsePhoneAndDialCode(fullPhone: string): { country: CountryPhoneInfo; localNumber: string } {
  if (!fullPhone) {
    return { country: COUNTRY_PHONE_LIST[0], localNumber: '' };
  }

  const clean = fullPhone.trim();
  if (clean.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(clean);
    if (parsed && parsed.country) {
      const country = getCountryByCode(parsed.country);
      return { country, localNumber: parsed.nationalNumber || '' };
    }

    // Fallback: match dialCode prefix from longest to shortest
    const sorted = [...COUNTRY_PHONE_LIST].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (clean.startsWith(c.dialCode)) {
        const local = clean.slice(c.dialCode.length).replace(/^[^\d]+/, '');
        return { country: c, localNumber: local };
      }
    }
  }

  return { country: COUNTRY_PHONE_LIST[0], localNumber: clean.replace(/\D/g, '') };
}

export function validateAndFormatInternationalPhone(
  dialCode: string,
  localNumber: string,
  countryCode: CountryCode
): { isValid: boolean; e164: string; errorMsg?: string } {
  const digitsOnly = localNumber.replace(/\D/g, '');
  if (!digitsOnly) {
    return { isValid: false, e164: '', errorMsg: 'Phone number is required.' };
  }

  const fullNumber = `${dialCode}${digitsOnly}`;

  // Try libphonenumber-js validation
  try {
    const parsed = parsePhoneNumberFromString(fullNumber, countryCode);
    if (parsed && parsed.isValid()) {
      return { isValid: true, e164: parsed.number };
    }
  } catch {}

  // Basic fallback checks for global mobile length limits (7 to 15 digits)
  if (digitsOnly.length < 7 || digitsOnly.length > 14) {
    return {
      isValid: false,
      e164: '',
      errorMsg: `Invalid length for selected country. Local number should be between 7 and 14 digits.`,
    };
  }

  return { isValid: true, e164: fullNumber };
}
