import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { Card } from '../../../components/Card/Card';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangeFormValues = z.infer<typeof changePasswordSchema>;

const ChangePasswordComponent: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: useMemo(() => ({ oldPassword: '', newPassword: '', confirmPassword: '' }), []),
  });

  const mutation = useMutation({
    mutationFn: (values: Omit<ChangeFormValues, 'confirmPassword'>) => authApi.changePassword(values),
    onSuccess: () => {
      toastService.success('Password changed successfully');
      reset();
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to change password';
      logger.error('Change password failed', error);
      toastService.error(errMsg);
    },
  });

  const onSubmit = useCallback(
    (values: ChangeFormValues) => {
      mutation.mutate({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
    },
    [mutation]
  );

  return (
    <div className="max-w-md mx-auto">
      <Card title="Change Account Password" subtitle="Keep your credentials secure by changing them regularly">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
          <Input
            {...register('oldPassword')}
            type="password"
            label="Current Password"
            placeholder="••••••••"
            error={errors.oldPassword?.message}
            icon={useMemo(() => <Lock className="h-4 w-4" />, [])}
            autoComplete="current-password"
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
            label="Confirm New Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            icon={useMemo(() => <Lock className="h-4 w-4" />, [])}
            autoComplete="new-password"
          />

          <Button type="submit" isLoading={mutation.isPending} className="w-full mt-2">
            Change Password
          </Button>
        </form>
      </Card>
    </div>
  );
};

export const ChangePassword = React.memo(ChangePasswordComponent);
ChangePassword.displayName = 'ChangePassword';
export default ChangePassword;
