import axiosClient from './axiosClient';
import type { User, VendorProfile, ActivityLog } from '../types';

export const adminApi = {
  async getDashboard(): Promise<{
    totalVendors: number;
    approvedVendors: number;
    pendingVendors: number;
    rejectedVendors: number;
    totalUsers: number;
    totalServices: number;
  }> {
    const res = await axiosClient.get('/admin/dashboard');
    return res.data.data;
  },

  async listVendors(params?: { page?: number; limit?: number }): Promise<{ data: VendorProfile[]; pagination: any }> {
    const res = await axiosClient.get('/admin/vendors', { params });
    return res.data.data;
  },

  async searchVendors(query: string, params?: { page?: number; limit?: number }): Promise<{ data: VendorProfile[]; pagination: any }> {
    const res = await axiosClient.get('/admin/vendors/search', { params: { q: query, ...params } });
    return res.data.data;
  },

  async filterVendors(
    filters: {
      mainCategoryId?: string;
      categoryId?: string;
      subCategoryId?: string;
      scope?: string;
    },
    params?: { page?: number; limit?: number }
  ): Promise<{ data: VendorProfile[]; pagination: any }> {
    const res = await axiosClient.get('/admin/vendors/filter', { params: { ...filters, ...params } });
    return res.data.data;
  },

  async getVendorDetails(id: string): Promise<VendorProfile & { user: User }> {
    const res = await axiosClient.get(`/admin/vendors/${id}`);
    return res.data.data;
  },

  async updateVendorStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<VendorProfile> {
    const res = await axiosClient.patch(`/admin/vendors/${id}/status`, { status });
    return res.data.data;
  },

  async listUsers(params?: { page?: number; limit?: number }): Promise<{ data: User[]; pagination: any }> {
    const res = await axiosClient.get('/admin/users', { params });
    return res.data.data;
  },

  async listActivityLogs(params?: { page?: number; limit?: number }): Promise<{ data: ActivityLog[]; pagination: any }> {
    const res = await axiosClient.get('/admin/activity-logs', { params });
    return res.data.data;
  },
};
