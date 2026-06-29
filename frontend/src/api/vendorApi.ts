import axiosClient from './axiosClient';
import type { VendorProfile, VendorService, VendorDocument } from '../types';

export const vendorApi = {
  async getProfile(): Promise<VendorProfile> {
    const res = await axiosClient.get('/vendors/profile');
    return res.data.data;
  },

  async updateProfile(data: any): Promise<VendorProfile> {
    const res = await axiosClient.put('/vendors/profile', data);
    return res.data.data;
  },

  async getServices(): Promise<VendorService[]> {
    const res = await axiosClient.get('/vendors/services');
    return res.data.data;
  },

  async addService(data: { subCategoryId: string; scopes: string[] }): Promise<VendorService> {
    const res = await axiosClient.post('/vendors/services', data);
    return res.data.data;
  },

  async updateService(id: string, data: { scopes: string[] }): Promise<VendorService> {
    const res = await axiosClient.put(`/vendors/services/${id}`, data);
    return res.data.data;
  },

  async deleteService(id: string): Promise<void> {
    await axiosClient.delete(`/vendors/services/${id}`);
  },

  async getDashboard(): Promise<{
    profile: {
      id: string;
      ownerName: string;
      companyName: string | null;
      vendorType: 'COMPANY' | 'INDIVIDUAL';
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      isSubmitted: boolean;
      profileCompletion: number;
    };
    serviceCount: number;
    recentActivities: Array<{ id: string; action: string; details: string; createdAt: string }>;
  }> {
    const res = await axiosClient.get('/vendors/dashboard');
    return res.data.data;
  },

  async getProfileCompletion(): Promise<{ completion: number; missingFields: string[] }> {
    const res = await axiosClient.get('/vendors/profile/completion');
    return res.data.data;
  },

  async getDocuments(): Promise<VendorDocument[]> {
    const res = await axiosClient.get('/vendors/documents');
    return res.data.data;
  },

  async requestUploadUrl(fileName: string, mimeType: string): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> {
    const res = await axiosClient.post('/vendors/documents/upload-url', { fileName, mimeType });
    return res.data.data;
  },

  async confirmUpload(data: { name: string; documentNumber?: string; fileKey: string; fileUrl: string; fileSize: number; mimeType: string }): Promise<VendorDocument> {
    const res = await axiosClient.post('/vendors/documents/confirm', data);
    return res.data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await axiosClient.delete(`/vendors/documents/${id}`);
  },

  async submitProfile(): Promise<void> {
    await axiosClient.post('/vendors/profile/submit');
  },
};
