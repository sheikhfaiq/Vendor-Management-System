import { calculateProfileCompletion, getMissingProfileFields } from '../src/utils/profileCompletion';

describe('Profile Completion Calculations', () => {
  describe('COMPANY type vendors', () => {
    it('should calculate 0% for empty profiles', () => {
      const profile: any = {
        vendorType: 'COMPANY',
      };
      expect(calculateProfileCompletion(profile)).toBe(0);
      expect(getMissingProfileFields(profile)).toContain('ownerName');
      expect(getMissingProfileFields(profile)).toContain('companyName');
    });

    it('should calculate 100% when all basic + company fields are present', () => {
      const profile: any = {
        vendorType: 'COMPANY',
        ownerName: 'Alice Owner',
        phone: '1234567890',
        address: '123 Main St',
        region: 'Riyadh Region',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        companyName: 'Corporate Entity LLC',
        tradeLicenseNo: 'TL-1234',
        taxRegistrationNo: 'TRN-5678',
      };
      expect(calculateProfileCompletion(profile)).toBe(100);
      expect(getMissingProfileFields(profile).length).toBe(0);
    });

    it('should calculate partial completion correctly', () => {
      const profile: any = {
        vendorType: 'COMPANY',
        ownerName: 'Alice Owner',
        phone: '1234567890',
        address: '123 Main St',
        region: 'Riyadh Region',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        companyName: 'Corporate Entity LLC',
        // tradeLicenseNo and taxRegistrationNo missing (7 / 9 completed)
      };
      // 7 / 9 = 78%
      expect(calculateProfileCompletion(profile)).toBe(78);
      expect(getMissingProfileFields(profile)).toContain('tradeLicenseNo');
      expect(getMissingProfileFields(profile)).toContain('taxRegistrationNo');
    });
  });

  describe('INDIVIDUAL type vendors', () => {
    it('should calculate 0% for empty profile', () => {
      const profile: any = {
        vendorType: 'INDIVIDUAL',
      };
      expect(calculateProfileCompletion(profile)).toBe(0);
    });

    it('should calculate completion based on the 15 required individual fields', () => {
      const profile: any = {
        vendorType: 'INDIVIDUAL',
        ownerName: 'John Individual', // Name
        phone: '1234567890',
        address: '123 Main St',
        region: 'Riyadh Region',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        assetName: 'John Trade', // Asset Name
        iqamaNumber: '1234567890', // IQAMA Number
        expiryDate: '2027-12-31', // Expiry Date
        nationality: 'Saudi', // Nationality
        bloodGroup: 'O+', // Blood Group
        gosiCertificateNo: 'GOSI-999', // GOSI
        insurancePolicyNo: 'INS-888', // Insurance
        iqamaProfession: 'Engineer', // Profession
        iqamaCompanyName: 'Sponsor LLC', // Company Name
      };
      expect(calculateProfileCompletion(profile)).toBe(100);
      expect(getMissingProfileFields(profile).length).toBe(0);
    });

    it('should detect missing fields correctly', () => {
      const profile: any = {
        vendorType: 'INDIVIDUAL',
        ownerName: 'John Individual',
        phone: '1234567890',
        address: '123 Main St',
        region: 'Riyadh Region',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        // assetName missing (14 / 15 completed)
        iqamaNumber: '1234567890',
        expiryDate: '2027-12-31',
        nationality: 'Saudi',
        bloodGroup: 'O+',
        gosiCertificateNo: 'GOSI-999',
        insurancePolicyNo: 'INS-888',
        iqamaProfession: 'Engineer',
        iqamaCompanyName: 'Sponsor LLC',
      };
      // 14 / 15 = 93%
      expect(calculateProfileCompletion(profile)).toBe(93);
      expect(getMissingProfileFields(profile)).toContain('assetName');
    });
  });
});
