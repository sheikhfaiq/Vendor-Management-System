import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordComponent: React.FC = () => {
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: useMemo(() => ({ email: '' }), []),
  });

  const mutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: (data) => {
      toastService.success('Reset instruction generated');
      if (data.token) {
        setResetToken(data.token);
      }
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Error occurred';
      logger.error('Forgot password failed', error);
      toastService.error(errMsg);
    },
  });

  const onSubmit = useCallback(
    (values: ForgotFormValues) => {
      mutation.mutate(values.email);
    },
    [mutation]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Reset password
        </h1>
        <p className="text-xs text-slate-400">
          Enter your email to obtain a reset token
        </p>
      </div>

      {resetToken ? (
        <div className="p-4.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex flex-col gap-3">
          <p className="text-xs font-semibold leading-relaxed">
            Success! In a production system, a reset email will be sent. For development testing, use this reset token below:
          </p>
          <div className="bg-white border border-emerald-200 p-2.5 rounded-lg font-mono text-xs select-all text-center font-bold">
            {resetToken}
          </div>
          <Link
            to={`/reset-password?token=${resetToken}`}
            className="text-xs font-bold text-center bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-lg transition-colors mt-1.5"
          >
            Go to Reset Page
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
          <Input
            {...register('email')}
            type="email"
            label="Email Address"
            placeholder="john@company.com"
            error={errors.email?.message}
            icon={useMemo(() => <Mail className="h-4 w-4" />, [])}
            autoComplete="email"
          />

          <Button type="submit" isLoading={mutation.isPending} className="w-full">
            Generate Reset Link
          </Button>
        </form>
      )}

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

export const ForgotPassword = React.memo(ForgotPasswordComponent);
ForgotPassword.displayName = 'ForgotPassword';
export default ForgotPassword;
