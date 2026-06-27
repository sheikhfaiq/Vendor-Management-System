import axiosClient from './axiosClient';
import type { MainCategory, Category, SubCategory } from '../types';

export const serviceApi = {
  async getServiceHierarchy(): Promise<MainCategory[]> {
    const res = await axiosClient.get('/services');
    return res.data.data;
  },

  async getMainCategories(): Promise<MainCategory[]> {
    const res = await axiosClient.get('/services/main-categories');
    return res.data.data;
  },

  async getCategories(mainCategoryId: string): Promise<Category[]> {
    const res = await axiosClient.get(`/services/categories/${mainCategoryId}`);
    return res.data.data;
  },

  async getSubCategories(categoryId: string): Promise<SubCategory[]> {
    const res = await axiosClient.get(`/services/sub-categories/${categoryId}`);
    return res.data.data;
  },

  async searchServices(query: string): Promise<any[]> {
    const res = await axiosClient.get('/services/search', { params: { q: query } });
    return res.data.data;
  },

  async createService(data: { type: string; name: string; parentId?: string }): Promise<any> {
    const res = await axiosClient.post('/services', data);
    return res.data.data;
  },

  async updateService(id: string, data: { type: string; name: string }): Promise<any> {
    const res = await axiosClient.put(`/services/${id}`, data);
    return res.data.data;
  },

  async deleteService(id: string): Promise<void> {
    await axiosClient.delete(`/services/${id}`);
  },
};
