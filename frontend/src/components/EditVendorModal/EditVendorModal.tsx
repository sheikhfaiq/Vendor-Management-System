import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../Modal/Modal';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Button } from '../Button/Button';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
import { SAUDI_REGIONS, SAUDI_CITIES_BY_REGION } from '../../constants/saudiGeography';
import type { VendorProfile } from '../../types';

const editProfileSchema = z.object({
  vendorType: z.enum(['COMPANY', 'INDIVIDUAL']),
  companyName: z.string().optional().or(z.null()),
  tradeLicenseNo: z.string().optional().or(z.null()),
  taxRegistrationNo: z.string().optional().or(z.null()),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('').or(z.null())),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  region: z.string().min(1, 'Region is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  businessCategory: z.string().min(1, 'Vendor role is required'),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: VendorProfile | null;
  onSave: (data: Partial<VendorProfile>) => Promise<void>;
  isSaving: boolean;
}

export const EditVendorModal: React.FC<EditVendorModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onSave,
  isSaving,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
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
    },
  });

  const selectedVendorType = useWatch({ control, name: 'vendorType' });
  const selectedRegion = useWatch({ control, name: 'region' });

  useEffect(() => {
    if (vendor) {
      reset({
        vendorType: vendor.vendorType,
        companyName: vendor.companyName || '',
        tradeLicenseNo: vendor.tradeLicenseNo || '',
        taxRegistrationNo: vendor.taxRegistrationNo || '',
        ownerName: vendor.ownerName || '',
        phone: vendor.phone || '',
        website: vendor.website || '',
        address: vendor.address || '',
        region: vendor.region || '',
        city: vendor.city || '',
        country: vendor.country || 'Saudi Arabia',
        businessCategory: vendor.businessCategory || '',
      });
    }
  }, [vendor, reset]);

  const roleOptions = useMemo(() => {
    if (selectedVendorType === 'COMPANY') {
      return [
        { value: '', label: 'Select Vendor Role' },
        { value: 'Contractor', label: 'Contractor' },
        { value: 'Sub-Contractor', label: 'Sub-Contractor' },
      ];
    } else {
      return [
        { value: '', label: 'Select Vendor Role' },
        { value: 'Consultant', label: 'Consultant' },
      ];
    }
  }, [selectedVendorType]);

  const regionOptions = useMemo(() => [
    { value: '', label: 'Select Region' },
    ...SAUDI_REGIONS,
  ], []);

  const cityOptions = useMemo(() => {
    const baseOptions = [{ value: '', label: 'Select City' }];
    if (!selectedRegion) return baseOptions;
    const cities = SAUDI_CITIES_BY_REGION[selectedRegion] || [];
    return [...baseOptions, ...cities];
  }, [selectedRegion]);

  const onSubmit = (data: EditProfileFormData) => {
    onSave({
      vendorType: data.vendorType,
      companyName: data.vendorType === 'COMPANY' ? data.companyName : null,
      tradeLicenseNo: data.vendorType === 'COMPANY' ? data.tradeLicenseNo : null,
      taxRegistrationNo: data.vendorType === 'COMPANY' ? data.taxRegistrationNo : null,
      ownerName: data.ownerName,
      phone: data.phone,
      website: data.website || null,
      address: data.address,
      region: data.region,
      city: data.city,
      country: data.country,
      businessCategory: data.businessCategory,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Contractor Profile Details"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            {...register('vendorType')}
            label="Vendor Type"
            options={[
              { value: 'COMPANY', label: 'Corporate Entity' },
              { value: 'INDIVIDUAL', label: 'Individual Proprietorship' },
            ]}
            error={errors.vendorType?.message}
          />
          <Select
            {...register('businessCategory')}
            label="Vendor Role"
            options={roleOptions}
            error={errors.businessCategory?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedVendorType === 'COMPANY' ? (
            <Input
              {...register('companyName')}
              label="Company Name"
              placeholder="Contracting LLC"
              error={errors.companyName?.message}
            />
          ) : (
            <div className="hidden" />
          )}
          <Input
            {...register('ownerName')}
            label="Primary Contact / Owner"
            placeholder="Owner Name"
            error={errors.ownerName?.message}
          />
        </div>

        {selectedVendorType === 'COMPANY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <Input
              {...register('tradeLicenseNo')}
              label="Trade License #"
              placeholder="TL-123456"
              error={errors.tradeLicenseNo?.message}
            />
            <Input
              {...register('taxRegistrationNo')}
              label="Tax Registration (TRN) #"
              placeholder="TRN-987654"
              error={errors.taxRegistrationNo?.message}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('phone')}
            label="Phone Number"
            placeholder="+966 50 123 4567"
            error={errors.phone?.message}
          />
          <Input
            {...register('website')}
            label="Website Address"
            placeholder="https://company.com"
            error={errors.website?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            {...register('country')}
            label="Country"
            readOnly
            className="bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
            error={errors.country?.message}
          />
          <Controller
            name="region"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                label="Saudi Region"
                placeholder="Select Region..."
                options={regionOptions}
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
                label="City"
                placeholder="Select City..."
                options={cityOptions}
                disabled={!selectedRegion}
                value={field.value}
                onChange={field.onChange}
                error={errors.city?.message}
              />
            )}
          />
        </div>

        <Input
          {...register('address')}
          label="Detailed Address"
          placeholder="District, Street name, Building No."
          error={errors.address?.message}
        />

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
