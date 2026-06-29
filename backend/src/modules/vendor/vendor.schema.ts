import { z } from 'zod';

export const updateProfileSchema = z.object({
  vendorType: z.enum(['COMPANY', 'INDIVIDUAL']).optional(),
  companyName: z.string().optional().or(z.null()),
  tradeLicenseNo: z.string().optional().or(z.null()),
  taxRegistrationNo: z.string().optional().or(z.null()),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters').optional(),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('').or(z.null())),
  address: z.string().min(5, 'Address must be at least 5 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').optional(),
  region: z.string().min(2, 'Region must be at least 2 characters').optional().or(z.null()),
  country: z.string().min(2, 'Country must be at least 2 characters').optional(),
  businessCategory: z.string().optional(),
  
  // Custom Individual Vendor fields
  assetName: z.string().optional().or(z.null()),
  iqamaNumber: z.string().optional().or(z.null()),
  expiryDate: z.string().optional().or(z.null()),
  nationality: z.string().optional().or(z.null()),
  bloodGroup: z.string().optional().or(z.null()),
  gosiCertificateNo: z.string().optional().or(z.null()),
  insurancePolicyNo: z.string().optional().or(z.null()),
  iqamaProfession: z.string().optional().or(z.null()),
  iqamaCompanyName: z.string().optional().or(z.null()),
});

export const addVendorServiceSchema = z.object({
  subCategoryId: z.string().uuid('Invalid subcategory ID'),
  scopes: z.array(
    z.enum(['DESIGN_ENGINEERING', 'SUPPLY', 'INSTALLATION', 'TESTING_COMMISSIONING'])
  ).min(1, 'At least one scope of work must be specified'),
});

export const updateVendorServiceSchema = z.object({
  scopes: z.array(
    z.enum(['DESIGN_ENGINEERING', 'SUPPLY', 'INSTALLATION', 'TESTING_COMMISSIONING'])
  ).min(1, 'At least one scope of work must be specified'),
});
