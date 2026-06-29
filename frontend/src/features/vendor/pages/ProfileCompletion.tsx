import React, { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vendorApi } from '../../../api/vendorApi';
import { Input } from '../../../components/Input/Input';
import { Select } from '../../../components/Select/Select';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import { Loader } from '../../../components/Loader/Loader';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import { User, Phone, MapPin, Building, Globe, Calendar, CreditCard, Flag, FileText, Briefcase, Shield, Lock } from 'lucide-react';
import { SAUDI_REGIONS, SAUDI_CITIES_BY_REGION } from '../../../constants/saudiGeography';
import { SearchableSelect } from '../../../components/SearchableSelect/SearchableSelect';

const profileCompletionSchema = z
  .object({
    vendorType: z.enum(['COMPANY', 'INDIVIDUAL']),
    businessCategory: z.string().min(1, 'Vendor Role is required'),
    ownerName: z.string().min(2, 'Name must be at least 2 characters'),
    
    // Company specific or basic fields
    companyName: z.string().optional().or(z.literal('')),
    tradeLicenseNo: z.string().optional().or(z.literal('')),
    taxRegistrationNo: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    region: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    country: z.string().optional().or(z.literal('')),

    // Individual specific fields
    assetName: z.string().optional().or(z.literal('')),
    iqamaNumber: z.string().optional().or(z.literal('')),
    expiryDate: z.string().optional().or(z.literal('')),
    nationality: z.string().optional().or(z.literal('')),
    bloodGroup: z.string().optional().or(z.literal('')),
    gosiCertificateNo: z.string().optional().or(z.literal('')),
    insurancePolicyNo: z.string().optional().or(z.literal('')),
    iqamaProfession: z.string().optional().or(z.literal('')),
    iqamaCompanyName: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.vendorType === 'COMPANY') {
      if (!data.companyName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Company Name is required', path: ['companyName'] });
      }
      if (!data.tradeLicenseNo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Trade License # is required', path: ['tradeLicenseNo'] });
      }
      if (!data.taxRegistrationNo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tax Registration (TRN) is required', path: ['taxRegistrationNo'] });
      }
      if (!data.phone || data.phone.trim().length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Phone number must be at least 8 digits', path: ['phone'] });
      }
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Address must be at least 5 characters', path: ['address'] });
      }
      if (!data.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Region is required', path: ['region'] });
      }
      if (!data.city) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['city'] });
      }
      if (!data.country || data.country.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Country is required', path: ['country'] });
      }
    } else {
      // For INDIVIDUAL
      if (!data.phone || data.phone.trim().length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Phone number must be at least 8 digits', path: ['phone'] });
      }
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Address must be at least 5 characters', path: ['address'] });
      }
      if (!data.region) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Region is required', path: ['region'] });
      }
      if (!data.city) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'City is required', path: ['city'] });
      }
      if (!data.country || data.country.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Country is required', path: ['country'] });
      }
      if (!data.assetName || data.assetName.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Asset/Trade Name must be at least 2 characters', path: ['assetName'] });
      }
      if (!data.iqamaNumber || data.iqamaNumber.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ID/Iqama Number must be at least 2 characters', path: ['iqamaNumber'] });
      }
      if (!data.expiryDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expiry Date is required', path: ['expiryDate'] });
      }
      if (!data.nationality || data.nationality.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nationality must be at least 2 characters', path: ['nationality'] });
      }
      if (!data.bloodGroup) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Blood Group is required', path: ['bloodGroup'] });
      }
      if (!data.gosiCertificateNo || data.gosiCertificateNo.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'GOSI Certificate Number must be at least 2 characters', path: ['gosiCertificateNo'] });
      }
      if (!data.insurancePolicyNo || data.insurancePolicyNo.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Insurance Policy Number must be at least 2 characters', path: ['insurancePolicyNo'] });
      }
      if (!data.iqamaProfession || data.iqamaProfession.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Iqama Profession must be at least 2 characters', path: ['iqamaProfession'] });
      }
      if (!data.iqamaCompanyName || data.iqamaCompanyName.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Iqama Company Name must be at least 2 characters', path: ['iqamaCompanyName'] });
      }
    }
  });

type ProfileFormValues = z.infer<typeof profileCompletionSchema>;

const ProfileCompletionComponent: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: vendorApi.getProfile,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: useMemo(() => ({
      vendorType: 'COMPANY',
      companyName: '',
      tradeLicenseNo: '',
      taxRegistrationNo: '',
      ownerName: '',
      phone: '',
      website: '',
      address: '',
      region: '',
      city: '',
      country: 'Saudi Arabia',
      businessCategory: '',
      assetName: '',
      iqamaNumber: '',
      expiryDate: '',
      nationality: '',
      bloodGroup: '',
      gosiCertificateNo: '',
      insurancePolicyNo: '',
      iqamaProfession: '',
      iqamaCompanyName: '',
    }), []),
  });

  const selectedVendorType = useWatch({ control, name: 'vendorType' });
  const selectedRegion = useWatch({ control, name: 'region' });

  // Prefill form when data is loaded
  useEffect(() => {
    if (profile) {
      setValue('vendorType', profile.vendorType);
      setValue('companyName', profile.companyName || '');
      setValue('tradeLicenseNo', profile.tradeLicenseNo || '');
      setValue('taxRegistrationNo', profile.taxRegistrationNo || '');
      setValue('ownerName', profile.ownerName || '');
      setValue('phone', profile.phone || '');
      setValue('website', profile.website || '');
      setValue('address', profile.address || '');
      setValue('region', profile.region || '');
      setValue('city', profile.city || '');
      setValue('country', profile.country || 'Saudi Arabia');
      setValue('businessCategory', profile.businessCategory || '');
      setValue('assetName', profile.assetName || '');
      setValue('iqamaNumber', profile.iqamaNumber || '');
      setValue('nationality', profile.nationality || '');
      setValue('bloodGroup', profile.bloodGroup || '');
      setValue('gosiCertificateNo', profile.gosiCertificateNo || '');
      setValue('insurancePolicyNo', profile.insurancePolicyNo || '');
      setValue('iqamaProfession', profile.iqamaProfession || '');
      setValue('iqamaCompanyName', profile.iqamaCompanyName || '');

      let expDateStr = '';
      if (profile.expiryDate) {
        try {
          expDateStr = new Date(profile.expiryDate).toISOString().split('T')[0];
        } catch (e) {
          expDateStr = '';
        }
      }
      setValue('expiryDate', expDateStr);
    }
  }, [profile, setValue]);

  // Reset city when region changes, unless it matches the initial load city
  useEffect(() => {
    if (selectedRegion) {
      const currentCity = getValues('city');
      const validCities = SAUDI_CITIES_BY_REGION[selectedRegion] || [];
      const isValid = validCities.some((c) => c.value === currentCity);
      if (!isValid) {
        setValue('city', '');
      }
    } else {
      setValue('city', '');
    }
  }, [selectedRegion, setValue, getValues]);

  const mutation = useMutation({
    mutationFn: vendorApi.updateProfile,
    onSuccess: () => {
      toastService.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vendorProfile'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProfileCompletion'] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update profile';
      logger.error('Profile update failed', error);
      toastService.error(errMsg);
    },
  });

  const onSubmit = useCallback(
    (values: ProfileFormValues) => {
      // Merge values with original profile
      const mergedValues = {
        ...profile,
        ...values,
      };

      const payload = {
        ...mergedValues,
        companyName: mergedValues.vendorType === 'COMPANY' ? mergedValues.companyName : null,
        tradeLicenseNo: mergedValues.vendorType === 'COMPANY' ? mergedValues.tradeLicenseNo : null,
        taxRegistrationNo: mergedValues.vendorType === 'COMPANY' ? mergedValues.taxRegistrationNo : null,
        website: mergedValues.website || null,
        ...(mergedValues.vendorType === 'COMPANY' ? {
          assetName: null,
          iqamaNumber: null,
          expiryDate: null,
          nationality: null,
          bloodGroup: null,
          gosiCertificateNo: null,
          insurancePolicyNo: null,
          iqamaProfession: null,
          iqamaCompanyName: null,
        } : {
          companyName: null,
          tradeLicenseNo: null,
          taxRegistrationNo: null,
        }),
      };
      mutation.mutate(payload);
    },
    [profile, mutation]
  );

  const vendorTypeOptions = useMemo(() => [
    { value: 'COMPANY', label: 'Company' },
    { value: 'INDIVIDUAL', label: 'Individual / Freelancer' },
  ], []);

  const categoryOptions = useMemo(() => {
    if (selectedVendorType === 'INDIVIDUAL') {
      return [
        { value: '', label: 'Select Vendor Role' },
        { value: 'Engineer', label: 'Engineer' },
        { value: 'Supervisor', label: 'Supervisor' },
        { value: 'Forman', label: 'Forman' },
        { value: 'Technician', label: 'Technician' },
        { value: 'Labour', label: 'Labour' },
      ];
    } else {
      return [
        { value: '', label: 'Select Vendor Role' },
        { value: 'Client/Owner', label: 'Client / Owner' },
        { value: 'Contractor', label: 'Contractor' },
        { value: 'Sub-Contractor', label: 'Sub-Contractor' },
        { value: 'Consultant', label: 'Consultant' },
      ];
    }
  }, [selectedVendorType]);

  const saudiRegionOptions = useMemo(() => [
    { value: '', label: 'Select Region' },
    ...SAUDI_REGIONS,
  ], []);

  const cityOptions = useMemo(() => {
    const baseOptions = [{ value: '', label: 'Select City' }];
    if (!selectedRegion) return baseOptions;
    const cities = SAUDI_CITIES_BY_REGION[selectedRegion] || [];
    return [...baseOptions, ...cities];
  }, [selectedRegion]);

  const ownerNameLabel = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'Full Name' : 'Owner / Contact Person';
  }, [selectedVendorType]);

  const ownerNamePlaceholder = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'John Doe' : 'Owner Name';
  }, [selectedVendorType]);

  const userIcon = useMemo(() => <User className="h-4 w-4" />, []);
  const buildingIcon = useMemo(() => <Building className="h-4 w-4" />, []);
  const phoneIcon = useMemo(() => <Phone className="h-4 w-4" />, []);
  const globeIcon = useMemo(() => <Globe className="h-4 w-4" />, []);
  const mapPinIcon = useMemo(() => <MapPin className="h-4 w-4" />, []);

  if (isLoading) return <Loader />;

  // Determine if fields have already been filled in the database profile
  const isFormLocked = !profile || profile.status !== 'APPROVED';

  const isVendorTypeFilled = !!profile?.vendorType || isFormLocked;
  const isBusinessCategoryFilled = !!profile?.businessCategory || isFormLocked;
  const isOwnerNameFilled = !!profile?.ownerName || isFormLocked;
  const isCompanyNameFilled = !!profile?.companyName || isFormLocked;
  const isPhoneFilled = !!profile?.phone || isFormLocked;
  const isWebsiteFilled = !!profile?.website || isFormLocked;
  const isTradeLicenseNoFilled = !!profile?.tradeLicenseNo || isFormLocked;
  const isTaxRegistrationNoFilled = !!profile?.taxRegistrationNo || isFormLocked;
  const isRegionFilled = !!profile?.region || isFormLocked;
  const isCityFilled = !!profile?.city || isFormLocked;
  const isAddressFilled = !!profile?.address || isFormLocked;

  const isAssetFilled = !!profile?.assetName;
  const isIqamaNumberFilled = !!profile?.iqamaNumber;
  const isExpiryDateFilled = !!profile?.expiryDate;
  const isNationalityFilled = !!profile?.nationality;
  const isBloodGroupFilled = !!profile?.bloodGroup;
  const isGosiCertificateNoFilled = !!profile?.gosiCertificateNo;
  const isInsurancePolicyNoFilled = !!profile?.insurancePolicyNo;
  const isIqamaProfessionFilled = !!profile?.iqamaProfession;
  const isIqamaCompanyNameFilled = !!profile?.iqamaCompanyName;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Onboarding Profile Info</h1>
        <p className="text-sm text-slate-400 mt-1">
          Provide accurate documentation and contact details for compliance review in Saudi Arabia
        </p>
      </div>

      <Card
        title="Update Registration Profile"
        subtitle="Your profile completion status determines bid eligibility"
        className="w-full shadow-md border border-slate-100 rounded-2xl !overflow-visible"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full">
          {/* Row 1: Vendor Type, Vendor Role, Owner/Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              {...register('vendorType')}
              label="Vendor Type *"
              options={vendorTypeOptions}
              disabled={isVendorTypeFilled}
              error={errors.vendorType?.message}
            />
            <Select
              {...register('businessCategory')}
              label="Vendor Role *"
              options={categoryOptions}
              disabled={isBusinessCategoryFilled}
              error={errors.businessCategory?.message}
            />
            <Input
              {...register('ownerName')}
              type="text"
              label={`${ownerNameLabel} *`}
              placeholder={ownerNamePlaceholder}
              readOnly={isOwnerNameFilled}
              className={isOwnerNameFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
              error={errors.ownerName?.message}
              icon={userIcon}
            />
          </div>

          {/* Conditional Layout based on Vendor Type */}
          {selectedVendorType === 'INDIVIDUAL' ? (
            <div className="flex flex-col gap-6 w-full">
              {/* Row 1: Asset Name, Iqama Number, Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  {...register('assetName')}
                  type="text"
                  label="Asset/Trade Name *"
                  placeholder="Asset or Trade Name"
                  readOnly={isAssetFilled}
                  className={isAssetFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.assetName?.message}
                  icon={buildingIcon}
                />
                <Input
                  {...register('iqamaNumber')}
                  type="text"
                  label="ID/Iqama Number *"
                  placeholder="e.g. 2345678901"
                  readOnly={isIqamaNumberFilled}
                  className={isIqamaNumberFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.iqamaNumber?.message}
                  icon={<CreditCard className="h-4 w-4" />}
                />
                <Input
                  {...register('expiryDate')}
                  type="date"
                  label="Expiry Date *"
                  readOnly={isExpiryDateFilled}
                  className={isExpiryDateFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.expiryDate?.message}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>

              {/* Row 2: Nationality, Blood Group, GOSI Certificate Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  {...register('nationality')}
                  type="text"
                  label="Nationality *"
                  placeholder="Saudi"
                  readOnly={isNationalityFilled}
                  className={isNationalityFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.nationality?.message}
                  icon={<Flag className="h-4 w-4" />}
                />
                <Select
                  {...register('bloodGroup')}
                  label="Blood Group *"
                  options={[
                    { value: '', label: 'Select Blood Group' },
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                  ]}
                  disabled={isBloodGroupFilled}
                  error={errors.bloodGroup?.message}
                />
                <Input
                  {...register('gosiCertificateNo')}
                  type="text"
                  label="GOSI Certificate Number *"
                  placeholder="GOSI Number"
                  readOnly={isGosiCertificateNoFilled}
                  className={isGosiCertificateNoFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.gosiCertificateNo?.message}
                  icon={<FileText className="h-4 w-4" />}
                />
              </div>

              {/* Row 3: Insurance Policy Number, Iqama Profession, Iqama Company Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  {...register('insurancePolicyNo')}
                  type="text"
                  label="Insurance Policy Number *"
                  placeholder="Insurance Policy #"
                  readOnly={isInsurancePolicyNoFilled}
                  className={isInsurancePolicyNoFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.insurancePolicyNo?.message}
                  icon={<Shield className="h-4 w-4" />}
                />
                <Input
                  {...register('iqamaProfession')}
                  type="text"
                  label="Iqama Profession *"
                  placeholder="e.g. Electrical Engineer"
                  readOnly={isIqamaProfessionFilled}
                  className={isIqamaProfessionFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.iqamaProfession?.message}
                  icon={<Briefcase className="h-4 w-4" />}
                />
                <Input
                  {...register('iqamaCompanyName')}
                  type="text"
                  label="Iqama Company Name *"
                  placeholder="Sponsor Company Name"
                  readOnly={isIqamaCompanyNameFilled}
                  className={isIqamaCompanyNameFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.iqamaCompanyName?.message}
                  icon={buildingIcon}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              {/* Row 2: Company Name, Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  {...register('companyName')}
                  type="text"
                  label="Company Name *"
                  placeholder="Contractor LLC"
                  readOnly={isCompanyNameFilled}
                  className={isCompanyNameFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.companyName?.message}
                  icon={buildingIcon}
                />
                <Input
                  {...register('website')}
                  type="text"
                  label="Website"
                  placeholder="https://company.com"
                  readOnly={isWebsiteFilled}
                  className={isWebsiteFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                  error={errors.website?.message}
                  icon={globeIcon}
                />
              </div>

              {/* Company-specific Row */}
              <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Corporate Registration & Licensing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    {...register('tradeLicenseNo')}
                    type="text"
                    label="Trade License # *"
                    placeholder="TL-123456"
                    readOnly={isTradeLicenseNoFilled}
                    className={isTradeLicenseNoFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                    error={errors.tradeLicenseNo?.message}
                  />
                  <Input
                    {...register('taxRegistrationNo')}
                    type="text"
                    label="Tax Registration (TRN) *"
                    placeholder="TRN-987654"
                    readOnly={isTaxRegistrationNoFilled}
                    className={isTaxRegistrationNoFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                    error={errors.taxRegistrationNo?.message}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shared Contact & Address Section (Always Visible for Both INDIVIDUAL and COMPANY) */}
          <div className="flex flex-col gap-6 w-full border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contact & Address Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('phone')}
                type="text"
                label="Phone Number *"
                placeholder="+966 50 123 4567"
                readOnly={isPhoneFilled}
                className={isPhoneFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                error={errors.phone?.message}
                icon={phoneIcon}
              />
              <Input
                {...register('website')}
                type="text"
                label={selectedVendorType === 'INDIVIDUAL' ? 'Website' : 'Website Address'}
                placeholder={selectedVendorType === 'INDIVIDUAL' ? 'https://freelancer.com' : 'https://company.com'}
                readOnly={isWebsiteFilled}
                className={isWebsiteFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                error={errors.website?.message}
                icon={globeIcon}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                {...register('country')}
                type="text"
                label="Country *"
                placeholder="Saudi Arabia"
                readOnly={isFormLocked}
                className={isFormLocked ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                error={errors.country?.message}
                icon={globeIcon}
              />
              <Controller
                name="region"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="Saudi Region *"
                    placeholder="Select Region..."
                    options={saudiRegionOptions}
                    disabled={isRegionFilled}
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.region?.message}
                  />
                )}
              />
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    label="City *"
                    placeholder="Select City..."
                    options={cityOptions}
                    disabled={isCityFilled || !selectedRegion}
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.city?.message}
                  />
                )}
              />
            </div>

            <div>
              <Input
                {...register('address')}
                type="text"
                label="Detailed Address *"
                placeholder="District, Street name, Building No."
                readOnly={isAddressFilled}
                className={isAddressFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
                error={errors.address?.message}
                icon={mapPinIcon}
              />
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-2">
            {!isFormLocked ? (
              <Button
                type="submit"
                isLoading={mutation.isPending}
                className="w-full md:w-auto px-8 py-3 text-sm font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white shadow-sm"
              >
                Save Profile Information
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-100/50 p-3 rounded-xl select-none w-full md:w-auto">
                <Lock className="h-4 w-4" /> Profile Locked - Under Compliance Review
              </div>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export const ProfileCompletion = React.memo(ProfileCompletionComponent);
ProfileCompletion.displayName = 'ProfileCompletion';
export default ProfileCompletion;
