import { Role } from '@prisma/client';
import prisma from '../../config/prisma';

export class NotificationRepository {
  async createNotification(data: {
    userId?: string | null;
    role?: Role | null;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data,
    });
  }

  async getNotifications(userId: string, role: Role) {
    return prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { AND: [{ userId: null }, { role }] }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAllAsRead(userId: string, role: Role) {
    return prisma.notification.updateMany({
      where: {
        OR: [
          { userId },
          { AND: [{ userId: null }, { role }] }
        ],
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async clearAllNotifications(userId: string, role: Role) {
    return prisma.notification.deleteMany({
      where: {
        OR: [
          { userId },
          { AND: [{ userId: null }, { role }] }
        ]
      }
    });
  }
}

export const notificationRepository = new NotificationRepository();
