export const calculateProfileCompletion = (profile: {
  vendorType: 'COMPANY' | 'INDIVIDUAL';
  ownerName?: string | null;
  phone?: string | null;
  address?: string | null;
  region?: string | null;
  city?: string | null;
  country?: string | null;
  companyName?: string | null;
  tradeLicenseNo?: string | null;
  taxRegistrationNo?: string | null;
  serviceCount?: number;
  // Custom Individual Vendor fields
  assetName?: string | null;
  iqamaNumber?: string | null;
  expiryDate?: Date | string | null;
  nationality?: string | null;
  bloodGroup?: string | null;
  gosiCertificateNo?: string | null;
  insurancePolicyNo?: string | null;
  iqamaProfession?: string | null;
  iqamaCompanyName?: string | null;
}): number => {
  let score = 0;

  if (profile.vendorType === 'COMPANY') {
    // Basic fields check (always evaluated for COMPANY)
    let count = 0;
    if (profile.ownerName && profile.ownerName.trim().length >= 2) count++;
    if (profile.phone && profile.phone.trim().length >= 8) count++;
    if (profile.address && profile.address.trim().length >= 5) count++;
    if (profile.region && profile.region.trim().length >= 2) count++;
    if (profile.city && profile.city.trim().length >= 2) count++;
    if (profile.country && profile.country.trim().length >= 2) count++;
    if (profile.companyName && profile.companyName.trim().length > 0) count++;
    if (profile.tradeLicenseNo && profile.tradeLicenseNo.trim().length > 0) count++;
    if (profile.taxRegistrationNo && profile.taxRegistrationNo.trim().length > 0) count++;

    score = Math.round((count / 9) * 100);
  } else {
    // 15 fields total for INDIVIDUAL:
    // 5 contact/address fields + 10 custom individual fields
    let count = 0;
    if (profile.ownerName && profile.ownerName.trim().length >= 2) count++;
    if (profile.phone && profile.phone.trim().length >= 8) count++;
    if (profile.address && profile.address.trim().length >= 5) count++;
    if (profile.region && profile.region.trim().length >= 2) count++;
    if (profile.city && profile.city.trim().length >= 2) count++;
    if (profile.country && profile.country.trim().length >= 2) count++;
    if (profile.assetName && profile.assetName.trim().length >= 2) count++;
    if (profile.iqamaNumber && profile.iqamaNumber.trim().length >= 2) count++;
    if (profile.expiryDate) count++;
    if (profile.nationality && profile.nationality.trim().length >= 2) count++;
    if (profile.bloodGroup && profile.bloodGroup.trim().length >= 1) count++;
    if (profile.gosiCertificateNo && profile.gosiCertificateNo.trim().length >= 2) count++;
    if (profile.insurancePolicyNo && profile.insurancePolicyNo.trim().length >= 2) count++;
    if (profile.iqamaProfession && profile.iqamaProfession.trim().length >= 2) count++;
    if (profile.iqamaCompanyName && profile.iqamaCompanyName.trim().length >= 2) count++;

    score = Math.round((count / 15) * 100);
  }

  return Math.min(100, score);
};

export const getMissingProfileFields = (profile: {
  vendorType: 'COMPANY' | 'INDIVIDUAL';
  ownerName?: string | null;
  phone?: string | null;
  address?: string | null;
  region?: string | null;
  city?: string | null;
  country?: string | null;
  companyName?: string | null;
  tradeLicenseNo?: string | null;
  taxRegistrationNo?: string | null;
  serviceCount?: number;
  // Custom Individual Vendor fields
  assetName?: string | null;
  iqamaNumber?: string | null;
  expiryDate?: Date | string | null;
  nationality?: string | null;
  bloodGroup?: string | null;
  gosiCertificateNo?: string | null;
  insurancePolicyNo?: string | null;
  iqamaProfession?: string | null;
  iqamaCompanyName?: string | null;
}): string[] => {
  const missing: string[] = [];

  if (profile.vendorType === 'COMPANY') {
    if (!profile.ownerName || profile.ownerName.trim().length < 2) missing.push('ownerName');
    if (!profile.phone || profile.phone.trim().length < 8) missing.push('phone');
    if (!profile.address || profile.address.trim().length < 5) missing.push('address');
    if (!profile.region || profile.region.trim().length < 2) missing.push('region');
    if (!profile.city || profile.city.trim().length < 2) missing.push('city');
    if (!profile.country || profile.country.trim().length < 2) missing.push('country');
    if (!profile.companyName || profile.companyName.trim().length === 0) missing.push('companyName');
    if (!profile.tradeLicenseNo || profile.tradeLicenseNo.trim().length === 0) missing.push('tradeLicenseNo');
    if (!profile.taxRegistrationNo || profile.taxRegistrationNo.trim().length === 0) missing.push('taxRegistrationNo');
  } else {
    // For INDIVIDUAL
    if (!profile.ownerName || profile.ownerName.trim().length < 2) missing.push('ownerName');
    if (!profile.phone || profile.phone.trim().length < 8) missing.push('phone');
    if (!profile.address || profile.address.trim().length < 5) missing.push('address');
    if (!profile.region || profile.region.trim().length < 2) missing.push('region');
    if (!profile.city || profile.city.trim().length < 2) missing.push('city');
    if (!profile.country || profile.country.trim().length < 2) missing.push('country');
    if (!profile.assetName || profile.assetName.trim().length < 2) missing.push('assetName');
    if (!profile.iqamaNumber || profile.iqamaNumber.trim().length < 2) missing.push('iqamaNumber');
    if (!profile.expiryDate) missing.push('expiryDate');
    if (!profile.nationality || profile.nationality.trim().length < 2) missing.push('nationality');
    if (!profile.bloodGroup || profile.bloodGroup.trim().length < 1) missing.push('bloodGroup');
    if (!profile.gosiCertificateNo || profile.gosiCertificateNo.trim().length < 2) missing.push('gosiCertificateNo');
    if (!profile.insurancePolicyNo || profile.insurancePolicyNo.trim().length < 2) missing.push('insurancePolicyNo');
    if (!profile.iqamaProfession || profile.iqamaProfession.trim().length < 2) missing.push('iqamaProfession');
    if (!profile.iqamaCompanyName || profile.iqamaCompanyName.trim().length < 2) missing.push('iqamaCompanyName');
  }

  return missing;
};
