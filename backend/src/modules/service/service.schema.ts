import { z } from 'zod';

export const createServiceSchema = z
  .object({
    type: z.enum(['MAIN_CATEGORY', 'CATEGORY', 'SUB_CATEGORY']),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    parentId: z.string().uuid('Parent ID must be a valid UUID').optional(),
  })
  .refine(
    (data) => {
      if (data.type !== 'MAIN_CATEGORY' && !data.parentId) {
        return false;
      }
      return true;
    },
    {
      message: 'Parent ID is required when type is CATEGORY or SUB_CATEGORY',
      path: ['parentId'],
    }
  );

export const updateServiceSchema = z.object({
  type: z.enum(['MAIN_CATEGORY', 'CATEGORY', 'SUB_CATEGORY']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
