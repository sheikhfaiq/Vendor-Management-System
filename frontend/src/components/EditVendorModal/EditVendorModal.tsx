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

const editProfileSchema = z
  .object({
    vendorType: z.enum(['COMPANY', 'INDIVIDUAL']),
    businessCategory: z.string().min(1, 'Vendor role is required'),
    ownerName: z.string().min(2, 'Name must be at least 2 characters'),
    
    // Company specific or basic fields
    companyName: z.string().optional().or(z.null()),
    tradeLicenseNo: z.string().optional().or(z.null()),
    taxRegistrationNo: z.string().optional().or(z.null()),
    phone: z.string().optional().or(z.null()),
    website: z.string().url('Invalid website URL').optional().or(z.literal('').or(z.null())),
    address: z.string().optional().or(z.null()),
    region: z.string().optional().or(z.null()),
    city: z.string().optional().or(z.null()),
    country: z.string().optional().or(z.null()),

    // Individual specific fields
    assetName: z.string().optional().or(z.null()),
    iqamaNumber: z.string().optional().or(z.null()),
    expiryDate: z.string().optional().or(z.null()),
    nationality: z.string().optional().or(z.null()),
    bloodGroup: z.string().optional().or(z.null()),
    gosiCertificateNo: z.string().optional().or(z.null()),
    insurancePolicyNo: z.string().optional().or(z.null()),
    iqamaProfession: z.string().optional().or(z.null()),
    iqamaCompanyName: z.string().optional().or(z.null()),
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
      assetName: '',
      iqamaNumber: '',
      expiryDate: '',
      nationality: '',
      bloodGroup: '',
      gosiCertificateNo: '',
      insurancePolicyNo: '',
      iqamaProfession: '',
      iqamaCompanyName: '',
    },
  });

  const selectedVendorType = useWatch({ control, name: 'vendorType' });
  const selectedRegion = useWatch({ control, name: 'region' });

  useEffect(() => {
    if (vendor) {
      let expDateStr = '';
      if (vendor.expiryDate) {
        try {
          expDateStr = new Date(vendor.expiryDate).toISOString().split('T')[0];
        } catch (e) {
          expDateStr = '';
        }
      }

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
        assetName: vendor.assetName || '',
        iqamaNumber: vendor.iqamaNumber || '',
        expiryDate: expDateStr,
        nationality: vendor.nationality || '',
        bloodGroup: vendor.bloodGroup || '',
        gosiCertificateNo: vendor.gosiCertificateNo || '',
        insurancePolicyNo: vendor.insurancePolicyNo || '',
        iqamaProfession: vendor.iqamaProfession || '',
        iqamaCompanyName: vendor.iqamaCompanyName || '',
      });
    }
  }, [vendor, reset]);

  const roleOptions = useMemo(() => {
    if (selectedVendorType === 'COMPANY') {
      return [
        { value: '', label: 'Select Vendor Role' },
        { value: 'Client/Owner', label: 'Client / Owner' },
        { value: 'Contractor', label: 'Contractor' },
        { value: 'Sub-Contractor', label: 'Sub-Contractor' },
        { value: 'Consultant', label: 'Consultant' },
      ];
    } else {
      return [
        { value: '', label: 'Select Vendor Role' },
        { value: 'Engineer', label: 'Engineer' },
        { value: 'Supervisor', label: 'Supervisor' },
        { value: 'Forman', label: 'Forman' },
        { value: 'Technician', label: 'Technician' },
        { value: 'Labour', label: 'Labour' },
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

  const ownerLabel = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'Full Name' : 'Primary Contact / Owner';
  }, [selectedVendorType]);

  const ownerPlaceholder = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'John Doe' : 'Owner Name';
  }, [selectedVendorType]);

  const onSubmit = (data: EditProfileFormData) => {
    onSave({
      vendorType: data.vendorType,
      ownerName: data.ownerName,
      businessCategory: data.businessCategory,
      ...(data.vendorType === 'COMPANY' ? {
        companyName: data.companyName || null,
        tradeLicenseNo: data.tradeLicenseNo || null,
        taxRegistrationNo: data.taxRegistrationNo || null,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
        region: data.region || null,
        city: data.city || null,
        country: data.country || 'Saudi Arabia',
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
        phone: null,
        website: null,
        address: null,
        region: null,
        city: null,
        country: null,
        assetName: data.assetName || null,
        iqamaNumber: data.iqamaNumber || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
        nationality: data.nationality || null,
        bloodGroup: data.bloodGroup || null,
        gosiCertificateNo: data.gosiCertificateNo || null,
        insurancePolicyNo: data.insurancePolicyNo || null,
        iqamaProfession: data.iqamaProfession || null,
        iqamaCompanyName: data.iqamaCompanyName || null,
      }),
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
          <Input
            {...register('ownerName')}
            label={ownerLabel}
            placeholder={ownerPlaceholder}
            error={errors.ownerName?.message}
          />
          {selectedVendorType === 'COMPANY' && (
            <Input
              {...register('companyName')}
              label="Company Name"
              placeholder="Contracting LLC"
              error={errors.companyName?.message}
            />
          )}
        </div>

        {selectedVendorType === 'COMPANY' ? (
          <>
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


          </>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('assetName')}
                label="Asset/Trade Name"
                placeholder="Asset or Trade Name"
                error={errors.assetName?.message}
              />
              <Input
                {...register('iqamaNumber')}
                label="ID/Iqama Number"
                placeholder="e.g. 2345678901"
                error={errors.iqamaNumber?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('expiryDate')}
                type="date"
                label="Expiry Date"
                error={errors.expiryDate?.message}
              />
              <Input
                {...register('nationality')}
                label="Nationality"
                placeholder="Saudi"
                error={errors.nationality?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                {...register('bloodGroup')}
                label="Blood Group"
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
                error={errors.bloodGroup?.message}
              />
              <Input
                {...register('gosiCertificateNo')}
                label="GOSI Certificate Number"
                placeholder="GOSI Number"
                error={errors.gosiCertificateNo?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                {...register('insurancePolicyNo')}
                label="Insurance Policy Number"
                placeholder="Insurance Policy #"
                error={errors.insurancePolicyNo?.message}
              />
              <Input
                {...register('iqamaProfession')}
                label="Iqama Profession"
                placeholder="e.g. Electrical Engineer"
                error={errors.iqamaProfession?.message}
              />
              <Input
                {...register('iqamaCompanyName')}
                label="Iqama Company Name"
                placeholder="Sponsor Company Name"
                error={errors.iqamaCompanyName?.message}
              />
            </div>
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
            label="Country *"
            placeholder="Country"
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
                label="City"
                placeholder="Select City..."
                options={cityOptions}
                disabled={!selectedRegion}
                value={field.value || ''}
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
