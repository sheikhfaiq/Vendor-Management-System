import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Lock, ArrowLeft } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordComponent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: useMemo(() => ({ token: tokenParam, newPassword: '', confirmPassword: '' }), [tokenParam]),
  });

  // Keep form synchronized if query params change
  useEffect(() => {
    if (tokenParam) {
      setValue('token', tokenParam);
    }
  }, [tokenParam, setValue]);

  const mutation = useMutation({
    mutationFn: (values: Omit<ResetFormValues, 'confirmPassword'>) => authApi.resetPassword(values),
    onSuccess: () => {
      toastService.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to reset password';
      logger.error('Reset password failed', error);
      toastService.error(errMsg);
    },
  });

  const onSubmit = useCallback(
    (values: ResetFormValues) => {
      mutation.mutate({
        token: values.token,
        newPassword: values.newPassword,
      });
    },
    [mutation]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Enter new password
        </h1>
        <p className="text-xs text-slate-400">
          Provide your new credentials to restore access
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
        <Input
          {...register('token')}
          type="text"
          label="Reset Token"
          placeholder="PA-token-12345"
          error={errors.token?.message}
          disabled={!!tokenParam}
        />

        <Input
          {...register('newPassword')}
          type="password"
          label="New Password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          icon={useMemo(() => <Lock className="h-4 w-4" />, [])}
          autoComplete="new-password"
        />

        <Input
          {...register('confirmPassword')}
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          icon={useMemo(() => <Lock className="h-4 w-4" />, [])}
          autoComplete="new-password"
        />

        <Button type="submit" isLoading={mutation.isPending} className="w-full mt-2">
          Reset Password
        </Button>
      </form>

      <div className="flex justify-center mt-1">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export const ResetPassword = React.memo(ResetPasswordComponent);
ResetPassword.displayName = 'ResetPassword';
export default ResetPassword;
