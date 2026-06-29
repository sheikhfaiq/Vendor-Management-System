import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/', notificationController.getNotifications as any);
router.patch('/read', notificationController.markAllAsRead as any);
router.delete('/clear', notificationController.clearAllNotifications as any);

export default router;
