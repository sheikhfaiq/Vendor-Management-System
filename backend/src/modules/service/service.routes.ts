import { Router } from 'express';
import { serviceController } from './service.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createServiceSchema, updateServiceSchema } from './service.schema';

const router = Router();

router.get('/', serviceController.getServiceHierarchy);
router.get('/main-categories', serviceController.getMainCategories);
router.get('/categories/:mainCategoryId', serviceController.getCategories);
router.get('/sub-categories/:categoryId', serviceController.getSubCategories);
router.get('/search', serviceController.searchServices);

router.post(
  '/',
  authenticate as any,
  authorize(['ADMIN']) as any,
  validate({ body: createServiceSchema }),
  serviceController.createService as any
);

router.put(
  '/:id',
  authenticate as any,
  authorize(['ADMIN']) as any,
  validate({ body: updateServiceSchema }),
  serviceController.updateService as any
);

router.delete(
  '/:id',
  authenticate as any,
  authorize(['ADMIN']) as any,
  serviceController.deleteService as any
);

export default router;
