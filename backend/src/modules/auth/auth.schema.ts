import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    vendorType: z.enum(['COMPANY', 'INDIVIDUAL']),
    companyName: z.string().optional(),
    tradeLicenseNo: z.string().optional(),
    taxRegistrationNo: z.string().optional(),
    ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
    phone: z.string().min(8, 'Phone number must be at least 8 digits'),
    website: z.string().url('Invalid website URL').optional().or(z.literal('').or(z.null())),
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
      message: 'Company name, trade license, and tax registration number are required for COMPANY type',
      path: ['companyName'],
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
