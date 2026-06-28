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
import { User, Phone, MapPin, Building, Globe } from 'lucide-react';
import { SAUDI_REGIONS, SAUDI_CITIES_BY_REGION } from '../../../constants/saudiGeography';
import { SearchableSelect } from '../../../components/SearchableSelect/SearchableSelect';

const profileCompletionSchema = z
  .object({
    vendorType: z.enum(['COMPANY', 'INDIVIDUAL']),
    companyName: z.string().optional().or(z.literal('')),
    tradeLicenseNo: z.string().optional().or(z.literal('')),
    taxRegistrationNo: z.string().optional().or(z.literal('')),
    ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
    phone: z.string().min(8, 'Phone number must be at least 8 digits'),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    region: z.string().min(1, 'Region is required'),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
    businessCategory: z.string().min(1, 'Vendor Role is required'),
  })
  .refine(
    (data) => {
      if (data.vendorType === 'COMPANY') {
        return !!data.companyName && !!data.tradeLicenseNo && !!data.taxRegistrationNo;
      }
      return true;
    },
    {
      message: 'Required for Company profiles',
      path: ['companyName'],
    }
  );

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
      setValue('country', 'Saudi Arabia'); // Lock to Saudi Arabia as requested
      setValue('businessCategory', profile.businessCategory || '');
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
      // Merge values with original profile to prevent react-hook-form from omitting disabled select values
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
      };
      mutation.mutate(payload);
    },
    [profile, mutation]
  );

  const vendorTypeOptions = useMemo(() => [
    { value: 'COMPANY', label: 'Company / Contractor' },
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

  const companyNameLabel = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'Full Name' : 'Company Name';
  }, [selectedVendorType]);

  const companyNamePlaceholder = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'John Doe' : 'Contractor LLC';
  }, [selectedVendorType]);

  const userIcon = useMemo(() => <User className="h-4 w-4" />, []);
  const buildingIcon = useMemo(() => <Building className="h-4 w-4" />, []);
  const phoneIcon = useMemo(() => <Phone className="h-4 w-4" />, []);
  const globeIcon = useMemo(() => <Globe className="h-4 w-4" />, []);
  const mapPinIcon = useMemo(() => <MapPin className="h-4 w-4" />, []);

  if (isLoading) return <Loader />;

  // Determine if fields have already been filled in the database profile
  const isVendorTypeFilled = !!profile?.vendorType;
  const isBusinessCategoryFilled = !!profile?.businessCategory;
  const isOwnerNameFilled = !!profile?.ownerName;
  const isCompanyNameFilled = !!profile?.companyName;
  const isPhoneFilled = !!profile?.phone;
  const isWebsiteFilled = !!profile?.website;
  const isTradeLicenseNoFilled = !!profile?.tradeLicenseNo;
  const isTaxRegistrationNoFilled = !!profile?.taxRegistrationNo;
  const isRegionFilled = !!profile?.region;
  const isCityFilled = !!profile?.city;
  const isAddressFilled = !!profile?.address;

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
              label="Owner / Contact Person *"
              placeholder="Owner Name"
              readOnly={isOwnerNameFilled}
              className={isOwnerNameFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
              error={errors.ownerName?.message}
              icon={userIcon}
            />
          </div>

          {/* Row 2: Company Name, Phone, Website */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              {...register('companyName')}
              type="text"
              label={`${companyNameLabel} *`}
              placeholder={companyNamePlaceholder}
              readOnly={isCompanyNameFilled}
              className={isCompanyNameFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
              error={errors.companyName?.message}
              icon={buildingIcon}
            />
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
              label="Website"
              placeholder="https://company.com"
              readOnly={isWebsiteFilled}
              className={isWebsiteFilled ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
              error={errors.website?.message}
              icon={globeIcon}
            />
          </div>

          {/* Company-specific Row (Conditional) */}
          {selectedVendorType === 'COMPANY' && (
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
          )}

          {/* Row 3: Country, Region, City */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              {...register('country')}
              type="text"
              label="Country *"
              readOnly
              className="bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
              error={errors.country?.message}
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
                  value={field.value}
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
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.city?.message}
                />
              )}
            />
          </div>

          {/* Row 4: Address */}
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

          {/* Action button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={mutation.isPending}
              className="w-full md:w-auto px-8 py-3 text-sm font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white shadow-sm"
            >
              Save Profile Information
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const ProfileCompletion = React.memo(ProfileCompletionComponent);
ProfileCompletion.displayName = 'ProfileCompletion';
export default ProfileCompletion;
