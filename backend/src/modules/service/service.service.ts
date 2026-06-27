import { serviceRepository } from './service.repository';
import { AppError } from '../../middleware/error.middleware';
import { authRepository } from '../auth/auth.repository';

export class ServiceService {
  async getServiceHierarchy() {
    return serviceRepository.getServiceHierarchy();
  }

  async getMainCategories() {
    return serviceRepository.getMainCategories();
  }

  async getCategoriesByMainCategoryId(mainCategoryId: string) {
    const mainCategory = await serviceRepository.findMainCategoryById(mainCategoryId);
    if (!mainCategory) {
      throw new AppError('Main category not found', 404);
    }
    return serviceRepository.getCategoriesByMainCategoryId(mainCategoryId);
  }

  async getSubCategoriesByCategoryId(categoryId: string) {
    const category = await serviceRepository.findCategoryById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return serviceRepository.getSubCategoriesByCategoryId(categoryId);
  }

  async createService(data: any, userId?: string, ip?: string, userAgent?: string) {
    let result;
    if (data.type === 'MAIN_CATEGORY') {
      result = await serviceRepository.createMainCategory(data.name);
    } else if (data.type === 'CATEGORY') {
      const parent = await serviceRepository.findMainCategoryById(data.parentId);
      if (!parent) throw new AppError('Main category not found', 404);
      result = await serviceRepository.createCategory(data.name, data.parentId);
    } else if (data.type === 'SUB_CATEGORY') {
      const parent = await serviceRepository.findCategoryById(data.parentId);
      if (!parent) throw new AppError('Category not found', 404);
      result = await serviceRepository.createSubCategory(data.name, data.parentId);
    }

    if (userId) {
      await authRepository.createActivityLog(
        userId,
        'SERVICE_CREATE',
        `Created service element: ${data.name} (type: ${data.type})`,
        ip,
        userAgent
      );
    }

    return result;
  }

  async updateService(id: string, data: any, userId?: string, ip?: string, userAgent?: string) {
    let result;
    if (data.type === 'MAIN_CATEGORY') {
      const exists = await serviceRepository.findMainCategoryById(id);
      if (!exists) throw new AppError('Main category not found', 404);
      result = await serviceRepository.updateMainCategory(id, data.name);
    } else if (data.type === 'CATEGORY') {
      const exists = await serviceRepository.findCategoryById(id);
      if (!exists) throw new AppError('Category not found', 404);
      result = await serviceRepository.updateCategory(id, data.name);
    } else if (data.type === 'SUB_CATEGORY') {
      const exists = await serviceRepository.findSubCategoryById(id);
      if (!exists) throw new AppError('Subcategory not found', 404);
      result = await serviceRepository.updateSubCategory(id, data.name);
    }

    if (userId) {
      await authRepository.createActivityLog(
        userId,
        'SERVICE_UPDATE',
        `Updated service element ID ${id} to ${data.name} (type: ${data.type})`,
        ip,
        userAgent
      );
    }

    return result;
  }

  async deleteService(id: string, type: 'MAIN_CATEGORY' | 'CATEGORY' | 'SUB_CATEGORY', userId?: string, ip?: string, userAgent?: string) {
    if (type === 'MAIN_CATEGORY') {
      const exists = await serviceRepository.findMainCategoryById(id);
      if (!exists) throw new AppError('Main category not found', 404);
      await serviceRepository.deleteMainCategory(id);
    } else if (type === 'CATEGORY') {
      const exists = await serviceRepository.findCategoryById(id);
      if (!exists) throw new AppError('Category not found', 404);
      await serviceRepository.deleteCategory(id);
    } else if (type === 'SUB_CATEGORY') {
      const exists = await serviceRepository.findSubCategoryById(id);
      if (!exists) throw new AppError('Subcategory not found', 404);
      await serviceRepository.deleteSubCategory(id);
    }

    if (userId) {
      await authRepository.createActivityLog(
        userId,
        'SERVICE_DELETE',
        `Deleted service element ID ${id} (type: ${type})`,
        ip,
        userAgent
      );
    }
  }

  async searchServices(query: string) {
    if (!query) {
      throw new AppError('Search query is required', 400);
    }
    return serviceRepository.searchServices(query);
  }
}

export const serviceService = new ServiceService();
