export const calculateProfileCompletion = (profile: {
  vendorType: 'COMPANY' | 'INDIVIDUAL';
  ownerName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  companyName?: string | null;
  tradeLicenseNo?: string | null;
  taxRegistrationNo?: string | null;
  serviceCount?: number;
}): number => {
  let score = 0;

  // Basic fields check (always evaluated)
  if (profile.ownerName && profile.ownerName.trim().length >= 2) score += 10;
  if (profile.phone && profile.phone.trim().length >= 8) score += 10;
  if (profile.address && profile.address.trim().length >= 5) score += 10;
  if (profile.city && profile.city.trim().length >= 2) score += 10;
  if (profile.country && profile.country.trim().length >= 2) score += 10;

  if (profile.vendorType === 'COMPANY') {
    if (profile.companyName && profile.companyName.trim().length > 0) score += 10;
    if (profile.tradeLicenseNo && profile.tradeLicenseNo.trim().length > 0) score += 10;
    if (profile.taxRegistrationNo && profile.taxRegistrationNo.trim().length > 0) score += 10;
  } else {
    // For individual, adjust the 5 basic fields from 50% to 80% (1.6 multiplier)
    score = score * 1.6;
  }

  // Round it to avoid floats
  score = Math.round(score);

  // Add 20% for having at least one service
  if (profile.serviceCount && profile.serviceCount > 0) {
    score += 20;
  }

  return Math.min(100, score);
};

export const getMissingProfileFields = (profile: {
  vendorType: 'COMPANY' | 'INDIVIDUAL';
  ownerName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  companyName?: string | null;
  tradeLicenseNo?: string | null;
  taxRegistrationNo?: string | null;
  serviceCount?: number;
}): string[] => {
  const missing: string[] = [];

  if (!profile.ownerName || profile.ownerName.trim().length < 2) missing.push('ownerName');
  if (!profile.phone || profile.phone.trim().length < 8) missing.push('phone');
  if (!profile.address || profile.address.trim().length < 5) missing.push('address');
  if (!profile.city || profile.city.trim().length < 2) missing.push('city');
  if (!profile.country || profile.country.trim().length < 2) missing.push('country');

  if (profile.vendorType === 'COMPANY') {
    if (!profile.companyName || profile.companyName.trim().length === 0) missing.push('companyName');
    if (!profile.tradeLicenseNo || profile.tradeLicenseNo.trim().length === 0) missing.push('tradeLicenseNo');
    if (!profile.taxRegistrationNo || profile.taxRegistrationNo.trim().length === 0) missing.push('taxRegistrationNo');
  }

  if (!profile.serviceCount || profile.serviceCount === 0) {
    missing.push('serviceSelection');
  }

  return missing;
};
