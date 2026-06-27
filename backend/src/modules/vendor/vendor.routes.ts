import { Router } from 'express';
import { vendorController } from './vendor.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  updateProfileSchema,
  addVendorServiceSchema,
  updateVendorServiceSchema,
} from './vendor.schema';

const router = Router();

// Apply auth middleware to all vendor routes
router.use(authenticate as any);
router.use(authorize(['VENDOR']) as any);

router.get('/profile', vendorController.getProfile as any);
router.put('/profile', validate({ body: updateProfileSchema }), vendorController.updateProfile as any);
router.get('/services', vendorController.getServices as any);
router.post('/services', validate({ body: addVendorServiceSchema }), vendorController.addService as any);
router.put('/services/:id', validate({ body: updateVendorServiceSchema }), vendorController.updateService as any);
router.delete('/services/:id', vendorController.deleteService as any);
router.get('/dashboard', vendorController.getDashboard as any);
router.get('/profile/completion', vendorController.getProfileCompletion as any);

export default router;
