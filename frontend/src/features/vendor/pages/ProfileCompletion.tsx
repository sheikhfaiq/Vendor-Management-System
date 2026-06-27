import React, { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
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
    city: z.string().min(2, 'City must be at least 2 characters'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
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
      city: '',
      country: '',
    }), []),
  });

  const selectedVendorType = useWatch({ control, name: 'vendorType' });

  // Prefill form when data is loaded
  useEffect(() => {
    if (profile) {
      setValue('vendorType', profile.vendorType);
      setValue('companyName', profile.companyName || '');
      setValue('tradeLicenseNo', profile.tradeLicenseNo || '');
      setValue('taxRegistrationNo', profile.taxRegistrationNo || '');
      setValue('ownerName', profile.ownerName);
      setValue('phone', profile.phone);
      setValue('website', profile.website || '');
      setValue('address', profile.address);
      setValue('city', profile.city);
      setValue('country', profile.country);
    }
  }, [profile, setValue]);

  const mutation = useMutation({
    mutationFn: vendorApi.updateProfile,
    onSuccess: () => {
      toastService.success('Profile updated successfully');
      // Invalidate queries to fetch updated values
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
      const payload = {
        ...values,
        companyName: values.vendorType === 'COMPANY' ? values.companyName : null,
        tradeLicenseNo: values.vendorType === 'COMPANY' ? values.tradeLicenseNo : null,
        taxRegistrationNo: values.vendorType === 'COMPANY' ? values.taxRegistrationNo : null,
        website: values.website || null,
      };
      mutation.mutate(payload);
    },
    [mutation]
  );

  const vendorTypeOptions = useMemo(() => [
    { value: 'COMPANY', label: 'Company / Contractor' },
    { value: 'INDIVIDUAL', label: 'Individual / Freelancer' },
  ], []);

  // Hoist all icon memos to a stable position before any conditional returns
  const userIcon = useMemo(() => <User className="h-4 w-4" />, []);
  const buildingIcon = useMemo(() => <Building className="h-4 w-4" />, []);
  const phoneIcon = useMemo(() => <Phone className="h-4 w-4" />, []);
  const globeIcon = useMemo(() => <Globe className="h-4 w-4" />, []);
  const mapPinIcon = useMemo(() => <MapPin className="h-4 w-4" />, []);

  if (isLoading) return <Loader />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Onboarding Profile Info</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Provide accurate documentation and contact details for compliance review
        </p>
      </div>

      <Card title="Update Registration Profile" subtitle="Your profile completion status determines bid eligibility">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              {...register('vendorType')}
              label="Vendor Type"
              options={vendorTypeOptions}
              error={errors.vendorType?.message}
            />
            <Input
              {...register('ownerName')}
              type="text"
              label="Owner / Contact Person"
              placeholder="Owner Name"
              error={errors.ownerName?.message}
              icon={userIcon}
            />
          </div>

          {selectedVendorType === 'COMPANY' && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-4">
              <Input
                {...register('companyName')}
                type="text"
                label="Company Name"
                placeholder="Contractor LLC"
                error={errors.companyName?.message}
                icon={buildingIcon}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  {...register('tradeLicenseNo')}
                  type="text"
                  label="Trade License #"
                  placeholder="TL-123456"
                  error={errors.tradeLicenseNo?.message}
                />
                <Input
                  {...register('taxRegistrationNo')}
                  type="text"
                  label="Tax Registration (TRN)"
                  placeholder="TRN-987654"
                  error={errors.taxRegistrationNo?.message}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              {...register('phone')}
              type="text"
              label="Phone Number"
              placeholder="+971501234567"
              error={errors.phone?.message}
              icon={phoneIcon}
            />
            <Input
              {...register('website')}
              type="text"
              label="Website"
              placeholder="https://company.com"
              error={errors.website?.message}
              icon={globeIcon}
            />
          </div>

          <Input
            {...register('address')}
            type="text"
            label="Address"
            placeholder="Office 301, Tower B"
            error={errors.address?.message}
            icon={mapPinIcon}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              {...register('city')}
              type="text"
              label="City"
              placeholder="Dubai"
              error={errors.city?.message}
            />
            <Input
              {...register('country')}
              type="text"
              label="Country"
              placeholder="United Arab Emirates"
              error={errors.country?.message}
            />
          </div>

          <Button type="submit" isLoading={mutation.isPending} className="mt-2 w-full sm:w-auto">
            Save Profile Information
          </Button>
        </form>
      </Card>
    </div>
  );
};

export const ProfileCompletion = React.memo(ProfileCompletionComponent);
ProfileCompletion.displayName = 'ProfileCompletion';
export default ProfileCompletion;
