import axiosClient from './axiosClient';
import type { Notification } from '../types';

export const notificationApi = {
  async getNotifications(): Promise<Notification[]> {
    const res = await axiosClient.get('/notifications');
    return res.data.data;
  },

  async markAllAsRead(): Promise<void> {
    await axiosClient.patch('/notifications/read');
  },

  async clearAllNotifications(): Promise<void> {
    await axiosClient.delete('/notifications/clear');
  },
};
