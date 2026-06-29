import { Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getPaginationParams } from '../../utils/pagination';

export class AdminController {
  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, 'Admin dashboard stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  async listVendors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getPaginationParams(req.query);
      const status = req.query.status as string | undefined;
      const result = await adminService.listVendors(params, status);
      sendSuccess(res, 'Vendors retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getVendorDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const vendor = await adminService.getVendorById(id);
      sendSuccess(res, 'Vendor details retrieved successfully', vendor);
    } catch (error) {
      next(error);
    }
  }

  async updateVendorStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const { id } = req.params;
      const { status } = req.body;
      const vendor = await adminService.updateVendorStatus(
        adminId,
        id,
        status,
        req.ip,
        req.headers['user-agent'] as string
      );
      sendSuccess(res, `Vendor status updated to ${status} successfully`, vendor);
    } catch (error) {
      next(error);
    }
  }

  async searchVendors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;
      const params = getPaginationParams(req.query);
      const result = await adminService.searchVendors(q as string, params);
      sendSuccess(res, 'Vendors search completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async filterVendors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mainCategoryId, categoryId, subCategoryId, scope } = req.query;
      const params = getPaginationParams(req.query);
      const result = await adminService.filterVendors(
        { mainCategoryId, categoryId, subCategoryId, scope },
        params
      );
      sendSuccess(res, 'Vendors filtered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getPaginationParams(req.query);
      const result = await adminService.listUsers(params);
      sendSuccess(res, 'Users list retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async listActivityLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getPaginationParams(req.query);
      const result = await adminService.listActivityLogs(params);
      sendSuccess(res, 'Activity logs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateVendorProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId;
      const result = await adminService.updateVendorProfile(
        adminId,
        id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, 'Vendor profile details updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async addVendorService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId;
      const { subCategoryId, scopes } = req.body;
      const result = await adminService.addVendorService(
        adminId,
        id,
        subCategoryId,
        scopes,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, 'Vendor service mapping added successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async updateVendorService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, serviceId } = req.params;
      const adminId = req.user!.userId;
      const { scopes } = req.body;
      const result = await adminService.updateVendorService(
        adminId,
        id,
        serviceId,
        scopes,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, 'Vendor service mapping updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async deleteVendorService(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, serviceId } = req.params;
      const adminId = req.user!.userId;
      await adminService.deleteVendorService(
        adminId,
        id,
        serviceId,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, 'Vendor service mapping deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async listAllDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = getPaginationParams(req.query);
      const vendorId = req.query.vendorId as string | undefined;
      const result = await adminService.listAllDocuments(params, vendorId);
      sendSuccess(res, 'All vendor documents retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
