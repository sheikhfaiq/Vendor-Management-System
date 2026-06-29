import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    vendorType: z.enum(['COMPANY', 'INDIVIDUAL']),
    companyName: z.string().min(2, 'Company/Full name must be at least 2 characters'),
    businessCategory: z.enum([
      'Engineer',
      'Supervisor',
      'Forman',
      'Technician',
      'Labour',
      'Client/Owner',
      'Contractor',
      'Sub-Contractor',
      'Consultant',
    ]),
    country: z.string().min(2, 'Country must be at least 2 characters').optional(),
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
      message: 'Invalid category for the selected vendor type',
      path: ['businessCategory'],
    }
  );

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
