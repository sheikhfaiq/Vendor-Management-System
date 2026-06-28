import { Response, NextFunction } from 'express';
import { vendorService } from './vendor.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

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

  async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const documents = await vendorService.getDocuments(userId);
      sendSuccess(res, 'Vendor documents retrieved successfully', documents);
    } catch (error) {
      next(error);
    }
  }

  async generateUploadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { fileName, mimeType } = req.body;
      if (!fileName || !mimeType) {
        throw new AppError('fileName and mimeType are required', 400);
      }
      const data = await vendorService.generateUploadUrl(userId, fileName, mimeType);
      sendSuccess(res, 'Pre-signed upload URL generated successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async confirmUpload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { name, fileKey, fileUrl, fileSize, mimeType } = req.body;
      if (!name || !fileKey || !fileUrl || fileSize === undefined || !mimeType) {
        throw new AppError('Missing required document metadata fields', 400);
      }
      const document = await vendorService.confirmUpload(
        userId,
        { name, fileKey, fileUrl, fileSize: Number(fileSize), mimeType },
        req.ip,
        req.headers['user-agent'] as string
      );
      sendSuccess(res, 'Document uploaded successfully', document, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await vendorService.deleteDocument(userId, id, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async localUploadMock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileKey } = req.query;
      if (!fileKey || typeof fileKey !== 'string') {
        return next(new AppError('fileKey is required as query param', 400));
      }

      const chunks: any[] = [];
      req.on('data', (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          if (buffer.length === 0) {
            return next(new AppError('No file uploaded', 400));
          }
          const fileUrl = await vendorService.saveLocalFile(fileKey, buffer);
          sendSuccess(res, 'Local mock file written successfully', { fileUrl });
        } catch (err) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const vendorController = new VendorController();
