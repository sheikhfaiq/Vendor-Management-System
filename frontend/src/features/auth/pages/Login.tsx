import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../../../api/authApi';
import { Input } from '../../../components/Input/Input';
import { Button } from '../../../components/Button/Button';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';

const loginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginComponent: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    return (location.state as any)?.from?.pathname || '/';
  }, [location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: useMemo(() => ({ email: '', password: '' }), []),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      toastService.success('Logged in successfully');
      login(data);
      // Redirect to original page or role dashboard
      if (from === '/') {
        navigate(data.user.role === 'ADMIN' ? '/admin/dashboard' : '/vendor/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Invalid email or password';
      logger.error('Login failed', error);
      toastService.error(errMsg);
    },
  });

  const onSubmit = useCallback(
    (values: LoginFormValues) => {
      mutation.mutate(values);
    },
    [mutation]
  );

  const emailIcon = useMemo(() => <Mail className="h-4 w-4" />, []);
  const lockIcon = useMemo(() => <Lock className="h-4 w-4" />, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs text-slate-400">
          Sign in to access your VMS profile
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
        <Input
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="name@company.com"
          error={errors.email?.message}
          icon={emailIcon}
          autoComplete="email"
        />

        <div className="flex flex-col gap-1">
          <Input
            {...register('password')}
            type="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            icon={lockIcon}
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <Button type="submit" isLoading={mutation.isPending} className="w-full mt-2">
          Sign In
        </Button>
      </form>

      <div className="text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          Register here
        </Link>
      </div>
    </div>
  );
};

export const Login = React.memo(LoginComponent);
Login.displayName = 'Login';
export default Login;
