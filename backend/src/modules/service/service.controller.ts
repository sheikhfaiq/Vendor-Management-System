import { Request, Response, NextFunction } from 'express';
import { serviceService } from './service.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class ServiceController {
  async getServiceHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hierarchy = await serviceService.getServiceHierarchy();
      sendSuccess(res, 'Service hierarchy fetched successfully', hierarchy);
    } catch (error) {
      next(error);
    }
  }

  async getMainCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mainCategories = await serviceService.getMainCategories();
      sendSuccess(res, 'Main categories fetched successfully', mainCategories);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mainCategoryId } = req.params;
      const categories = await serviceService.getCategoriesByMainCategoryId(mainCategoryId);
      sendSuccess(res, 'Categories fetched successfully', categories);
    } catch (error) {
      next(error);
    }
  }

  async getSubCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const subCategories = await serviceService.getSubCategoriesByCategoryId(categoryId);
      sendSuccess(res, 'Subcategories fetched successfully', subCategories);
    } catch (error) {
      next(error);
    }
  }

  async createService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const service = await serviceService.createService(req.body, userId, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Service element created successfully', service, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const service = await serviceService.updateService(id, req.body, userId, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Service element updated successfully', service);
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type } = req.query;
      const userId = req.user?.userId;
      await serviceService.deleteService(id, type as any, userId, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Service element deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async searchServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;
      const results = await serviceService.searchServices(q as string);
      sendSuccess(res, 'Services search completed successfully', results);
    } catch (error) {
      next(error);
    }
  }
}

export const serviceController = new ServiceController();
