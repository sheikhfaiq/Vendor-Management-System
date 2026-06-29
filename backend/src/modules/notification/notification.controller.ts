import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { notificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role as Role;
      const notifications = await notificationService.getNotifications(userId, role);
      sendSuccess(res, 'Notifications retrieved successfully', notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role as Role;
      await notificationService.markAllAsRead(userId, role);
      sendSuccess(res, 'All notifications marked as read successfully');
    } catch (error) {
      next(error);
    }
  }

  async clearAllNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role as Role;
      await notificationService.clearAllNotifications(userId, role);
      sendSuccess(res, 'All notifications cleared successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
