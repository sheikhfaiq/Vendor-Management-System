import React, { useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, User as UserIcon, Phone, MapPin, Building, Globe } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { Input } from '../../../components/Input/Input';
import { Select } from '../../../components/Select/Select';
import { Button } from '../../../components/Button/Button';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';

const signupFormSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
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
      message: 'Required for Company registrations',
      path: ['companyName'],
    }
  );

type SignupFormValues = z.infer<typeof signupFormSchema>;

const SignupComponent: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: useMemo(() => ({
      email: '',
      password: '',
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

  const mutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      toastService.success('Account registered successfully! Please log in.');
      navigate('/login');
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Registration failed';
      logger.error('Registration failed', error);
      toastService.error(errMsg);
    },
  });

  const onSubmit = useCallback(
    (values: SignupFormValues) => {
      // Clean empty strings for optional fields before sending to API
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Create vendor account
        </h1>
        <p className="text-xs text-slate-400">
          Register to join our construction network
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        {/* Row 1: Email, Password, Vendor Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            {...register('email')}
            type="email"
            label="Email Address"
            placeholder="john@company.com"
            error={errors.email?.message}
            icon={<Mail className="h-4 w-4" />}
          />
          <Input
            {...register('password')}
            type="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            icon={<Lock className="h-4 w-4" />}
          />
          <Select
            {...register('vendorType')}
            label="Vendor Type"
            options={vendorTypeOptions}
            error={errors.vendorType?.message}
          />
        </div>

        {/* Row 2: Owner, Phone, Website */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            {...register('ownerName')}
            type="text"
            label="Contact Person / Owner"
            placeholder="John Doe"
            error={errors.ownerName?.message}
            icon={<UserIcon className="h-4 w-4" />}
          />
          <Input
            {...register('phone')}
            type="text"
            label="Phone Number"
            placeholder="+123456789"
            error={errors.phone?.message}
            icon={<Phone className="h-4 w-4" />}
          />
          <Input
            {...register('website')}
            type="text"
            label="Website (Optional)"
            placeholder="https://company.com"
            error={errors.website?.message}
            icon={<Globe className="h-4 w-4" />}
          />
        </div>

        {/* Company-specific fields */}
        {selectedVendorType === 'COMPANY' && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                {...register('companyName')}
                type="text"
                label="Company Name"
                placeholder="Construct LLC"
                error={errors.companyName?.message}
                icon={<Building className="h-4 w-4" />}
              />
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

        {/* Row 3: Address, City, Country */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            {...register('address')}
            type="text"
            label="Address"
            placeholder="Building 45, High Street"
            error={errors.address?.message}
            icon={<MapPin className="h-4 w-4" />}
          />
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

        <Button type="submit" isLoading={mutation.isPending} className="w-full mt-1">
          Submit & Register
        </Button>
      </form>

      <div className="text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export const Signup = React.memo(SignupComponent);
Signup.displayName = 'Signup';
export default Signup;
