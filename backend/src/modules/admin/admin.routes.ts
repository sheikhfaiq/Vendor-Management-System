import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateVendorStatusSchema, filterVendorsSchema } from './admin.schema';

const router = Router();

// Apply admin protection to all routes
router.use(authenticate as any);
router.use(authorize(['ADMIN']) as any);

router.get('/dashboard', adminController.getDashboard as any);
router.get('/vendors/search', adminController.searchVendors as any);
router.get('/vendors/filter', validate({ query: filterVendorsSchema }), adminController.filterVendors as any);
router.get('/vendors', adminController.listVendors as any);
router.get('/vendors/:id', adminController.getVendorDetails as any);
router.patch('/vendors/:id/status', validate({ body: updateVendorStatusSchema }), adminController.updateVendorStatus as any);
router.get('/users', adminController.listUsers as any);
router.get('/activity-logs', adminController.listActivityLogs as any);

export default router;
