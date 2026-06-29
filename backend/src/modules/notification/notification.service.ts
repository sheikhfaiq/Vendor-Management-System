import { Role } from '@prisma/client';
import { notificationRepository } from './notification.repository';

export class NotificationService {
  async createNotification(
    title: string,
    message: string,
    userId?: string | null,
    role?: Role | null
  ) {
    return notificationRepository.createNotification({
      userId,
      role,
      title,
      message,
    });
  }

  async getNotifications(userId: string, role: Role) {
    return notificationRepository.getNotifications(userId, role);
  }

  async markAllAsRead(userId: string, role: Role) {
    return notificationRepository.markAllAsRead(userId, role);
  }

  async clearAllNotifications(userId: string, role: Role) {
    return notificationRepository.clearAllNotifications(userId, role);
  }
}

export const notificationService = new NotificationService();
