import { z } from 'zod';

export const updateVendorStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const filterVendorsSchema = z.object({
  mainCategoryId: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  scope: z.enum(['DESIGN_ENGINEERING', 'SUPPLY', 'INSTALLATION', 'TESTING_COMMISSIONING']).optional(),
});
