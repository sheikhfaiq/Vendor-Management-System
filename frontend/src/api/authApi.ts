import axiosClient from './axiosClient';
import type { LoginResponse, User } from '../types';

export const authApi = {
  async signup(data: any): Promise<User> {
    const res = await axiosClient.post('/auth/signup', data);
    return res.data.data;
  },

  async login(data: any): Promise<LoginResponse> {
    const res = await axiosClient.post('/auth/login', data);
    return res.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await axiosClient.post('/auth/logout', { refreshToken });
  },

  async forgotPassword(email: string): Promise<{ token?: string; message: string }> {
    const res = await axiosClient.post('/auth/forgot-password', { email });
    return res.data.data || { message: res.data.message };
  },

  async resetPassword(data: any): Promise<void> {
    await axiosClient.post('/auth/reset-password', data);
  },

  async changePassword(data: any): Promise<void> {
    await axiosClient.post('/auth/change-password', data);
  },

  async getMe(): Promise<User> {
    const res = await axiosClient.get('/auth/me');
    return res.data.data;
  },
};
