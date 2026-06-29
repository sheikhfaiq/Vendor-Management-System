import React, { useCallback, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Building } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { Input } from '../../../components/Input/Input';
import { Select } from '../../../components/Select/Select';
import { Button } from '../../../components/Button/Button';
import { toastService } from '../../../lib/notifications/toastService';
import { COUNTRY_OPTIONS } from '../../../constants/saudiGeography';
import { logger } from '../../../lib/utils/logger';

const signupFormSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    vendorType: z.enum(['COMPANY', 'INDIVIDUAL']),
    companyName: z.string().min(2, 'Name must be at least 2 characters'),
    businessCategory: z.string().min(1, 'Vendor Role is required'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
  })
  .refine(
    (data) => {
      const individualOptions = ['Engineer', 'Supervisor', 'Forman', 'Technician', 'Labour'];
      const companyOptions = ['Client/Owner', 'Contractor', 'Sub-Contractor', 'Consultant'];
      if (data.vendorType === 'INDIVIDUAL') {
        return individualOptions.includes(data.businessCategory);
      } else {
        return companyOptions.includes(data.businessCategory);
      }
    },
    {
      message: 'Invalid role for the selected vendor type',
      path: ['businessCategory'],
    }
  );

type SignupFormValues = z.infer<typeof signupFormSchema>;

const SignupComponent: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: useMemo(() => ({
      email: '',
      password: '',
      vendorType: 'COMPANY',
      companyName: '',
      businessCategory: 'Contractor',
      country: 'Saudi Arabia',
    }), []),
  });

  const selectedVendorType = useWatch({ control, name: 'vendorType' });

  // Update default business category when vendor type changes
  useEffect(() => {
    if (selectedVendorType === 'INDIVIDUAL') {
      setValue('businessCategory', 'Engineer');
    } else {
      setValue('businessCategory', 'Contractor');
    }
  }, [selectedVendorType, setValue]);

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
      mutation.mutate(values);
    },
    [mutation]
  );

  const vendorTypeOptions = useMemo(() => [
    { value: 'COMPANY', label: 'Company' },
    { value: 'INDIVIDUAL', label: 'Individual / Freelancer' },
  ], []);

  const categoryOptions = useMemo(() => {
    if (selectedVendorType === 'INDIVIDUAL') {
      return [
        { value: 'Engineer', label: 'Engineer' },
        { value: 'Supervisor', label: 'Supervisor' },
        { value: 'Forman', label: 'Forman' },
        { value: 'Technician', label: 'Technician' },
        { value: 'Labour', label: 'Labour' },
      ];
    } else {
      return [
        { value: 'Client/Owner', label: 'Client / Owner' },
        { value: 'Contractor', label: 'Contractor' },
        { value: 'Sub-Contractor', label: 'Sub-Contractor' },
        { value: 'Consultant', label: 'Consultant' },
      ];
    }
  }, [selectedVendorType]);

  const companyNameLabel = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'Full Name' : 'Company Name';
  }, [selectedVendorType]);

  const companyNamePlaceholder = useMemo(() => {
    return selectedVendorType === 'INDIVIDUAL' ? 'John Doe' : 'Apex MEP Solutions';
  }, [selectedVendorType]);

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
        {/* Row 1: Email, Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>

        {/* Row 2: Vendor Type, Company Name / Full Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            {...register('vendorType')}
            label="Vendor Type"
            options={vendorTypeOptions}
            error={errors.vendorType?.message}
          />
          <Input
            {...register('companyName')}
            type="text"
            label={companyNameLabel}
            placeholder={companyNamePlaceholder}
            error={errors.companyName?.message}
            icon={<Building className="h-4 w-4" />}
          />
        </div>

        {/* Row 3: Vendor Role & Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            {...register('businessCategory')}
            label="Vendor Role"
            options={categoryOptions}
            error={errors.businessCategory?.message}
          />
          <Select
            {...register('country')}
            label="Country"
            options={COUNTRY_OPTIONS}
            error={errors.country?.message}
          />
        </div>

        <Button type="submit" isLoading={mutation.isPending} className="w-full mt-2">
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
