import { Response, NextFunction } from 'express';
import { vendorService } from './vendor.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class VendorController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await vendorService.getProfileByUserId(userId);
      sendSuccess(res, 'Vendor profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await vendorService.updateProfile(userId, req.body, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Vendor profile updated successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  async getServices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const services = await vendorService.getServices(userId);
      sendSuccess(res, 'Vendor services retrieved successfully', services);
    } catch (error) {
      next(error);
    }
  }

  async addService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { subCategoryId, scopes } = req.body;
      const mapping = await vendorService.addService(userId, subCategoryId, scopes, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Service added successfully', mapping, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { scopes } = req.body;
      const mapping = await vendorService.updateService(userId, id, scopes, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Service scopes updated successfully', mapping);
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await vendorService.deleteService(userId, id, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Service mapping deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await vendorService.getDashboardSummary(userId);
      sendSuccess(res, 'Vendor dashboard stats retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async getProfileCompletion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await vendorService.getProfileCompletion(userId);
      sendSuccess(res, 'Profile completion percentage retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

export const vendorController = new VendorController();
