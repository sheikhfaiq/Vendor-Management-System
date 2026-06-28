import { vendorRepository } from './vendor.repository';
import { serviceRepository } from '../service/service.repository';
import { authRepository } from '../auth/auth.repository';
import { calculateProfileCompletion, getMissingProfileFields } from '../../utils/profileCompletion';
import { AppError } from '../../middleware/error.middleware';
import { ScopeOfWork } from '@prisma/client';
import { storageService } from '../../utils/storage.service';

export class VendorService {
  async getProfileByUserId(userId: string) {
    const profile = await vendorRepository.getProfileByUserId(userId);
    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }
    return profile;
  }

  async updateProfile(userId: string, data: any, ip?: string, userAgent?: string) {
    const profile = await vendorRepository.getProfileByUserId(userId);
    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }

    // Merge updates
    const updatedFields = {
      ...profile,
      ...data,
    };

    const serviceCount = await vendorRepository.countServicesByVendorId(profile.id);

    // Recalculate profile completion
    const completion = calculateProfileCompletion({
      vendorType: updatedFields.vendorType,
      ownerName: updatedFields.ownerName,
      phone: updatedFields.phone,
      address: updatedFields.address,
      city: updatedFields.city,
      country: updatedFields.country,
      companyName: updatedFields.companyName,
      tradeLicenseNo: updatedFields.tradeLicenseNo,
      taxRegistrationNo: updatedFields.taxRegistrationNo,
      serviceCount,
    });

    const updatedProfile = await vendorRepository.updateProfile(userId, {
      ...data,
      profileCompletion: completion,
    });

    await authRepository.createActivityLog(
      userId,
      'VENDOR_PROFILE_UPDATE',
      'Updated vendor profile information',
      ip,
      userAgent
    );

    return updatedProfile;
  }

  async getServices(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return vendorRepository.getServicesByVendorId(profile.id);
  }

  async addService(userId: string, subCategoryId: string, scopes: ScopeOfWork[], ip?: string, userAgent?: string) {
    const profile = await this.getProfileByUserId(userId);

    // Verify subcategory exists
    const subCategory = await serviceRepository.findSubCategoryById(subCategoryId);
    if (!subCategory) {
      throw new AppError('Subcategory not found', 404);
    }

    // Verify if already mapped
    const existing = await vendorRepository.findVendorServiceByMapping(profile.id, subCategoryId);
    if (existing) {
      throw new AppError('This service is already registered for your profile', 400);
    }

    const mapping = await vendorRepository.addService(profile.id, subCategoryId, scopes);

    // Recalculate completion
    const serviceCount = await vendorRepository.countServicesByVendorId(profile.id);
    const completion = calculateProfileCompletion({
      vendorType: profile.vendorType,
      ownerName: profile.ownerName,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      companyName: profile.companyName,
      tradeLicenseNo: profile.tradeLicenseNo,
      taxRegistrationNo: profile.taxRegistrationNo,
      serviceCount,
    });

    await vendorRepository.updateProfile(userId, {
      profileCompletion: completion,
    });

    await authRepository.createActivityLog(
      userId,
      'VENDOR_SERVICE_ADDED',
      `Added service subcategory: ${subCategory.name}`,
      ip,
      userAgent
    );

    return mapping;
  }

  async updateService(userId: string, id: string, scopes: ScopeOfWork[], ip?: string, userAgent?: string) {
    const profile = await this.getProfileByUserId(userId);

    const mapping = await vendorRepository.getVendorServiceById(id);
    if (!mapping) {
      throw new AppError('Vendor service mapping not found', 404);
    }

    if (mapping.vendorProfileId !== profile.id) {
      throw new AppError('Forbidden access - service does not belong to you', 403);
    }

    const updatedMapping = await vendorRepository.updateService(id, scopes);

    await authRepository.createActivityLog(
      userId,
      'VENDOR_SERVICE_UPDATED',
      `Updated scopes for service mapping ID: ${id}`,
      ip,
      userAgent
    );

    return updatedMapping;
  }

  async deleteService(userId: string, id: string, ip?: string, userAgent?: string) {
    const profile = await this.getProfileByUserId(userId);

    const mapping = await vendorRepository.getVendorServiceById(id);
    if (!mapping) {
      throw new AppError('Vendor service mapping not found', 404);
    }

    if (mapping.vendorProfileId !== profile.id) {
      throw new AppError('Forbidden access - service does not belong to you', 403);
    }

    await vendorRepository.deleteService(id);

    // Recalculate completion
    const serviceCount = await vendorRepository.countServicesByVendorId(profile.id);
    const completion = calculateProfileCompletion({
      vendorType: profile.vendorType,
      ownerName: profile.ownerName,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      companyName: profile.companyName,
      tradeLicenseNo: profile.tradeLicenseNo,
      taxRegistrationNo: profile.taxRegistrationNo,
      serviceCount,
    });

    await vendorRepository.updateProfile(userId, {
      profileCompletion: completion,
    });

    await authRepository.createActivityLog(
      userId,
      'VENDOR_SERVICE_DELETED',
      `Deleted service mapping ID: ${id}`,
      ip,
      userAgent
    );
  }

  async getDashboardSummary(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const serviceCount = await vendorRepository.countServicesByVendorId(profile.id);
    const recentActivities = await vendorRepository.getRecentActivityLogs(userId);

    return {
      profile: {
        id: profile.id,
        ownerName: profile.ownerName,
        companyName: profile.companyName,
        vendorType: profile.vendorType,
        status: profile.status,
        profileCompletion: profile.profileCompletion,
      },
      serviceCount,
      recentActivities,
    };
  }

  async getProfileCompletion(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const serviceCount = await vendorRepository.countServicesByVendorId(profile.id);
    const missingFields = getMissingProfileFields({
      vendorType: profile.vendorType,
      ownerName: profile.ownerName,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      companyName: profile.companyName,
      tradeLicenseNo: profile.tradeLicenseNo,
      taxRegistrationNo: profile.taxRegistrationNo,
      serviceCount,
    });
    return {
      completion: profile.profileCompletion,
      missingFields,
    };
  }

  async getDocuments(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const documents = await vendorRepository.getDocumentsByProfileId(profile.id);
    
    // Dynamically generate download/view URL for each document
    return Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        fileUrl: await storageService.generateDownloadUrl(doc.fileKey),
      }))
    );
  }

  async generateUploadUrl(userId: string, fileName: string, mimeType: string) {
    const profile = await this.getProfileByUserId(userId);
    return storageService.generateUploadUrl(fileName, mimeType, profile.id);
  }

  async confirmUpload(
    userId: string,
    data: { name: string; fileKey: string; fileUrl: string; fileSize: number; mimeType: string },
    ip?: string,
    userAgent?: string
  ) {
    const profile = await this.getProfileByUserId(userId);
    
    const document = await vendorRepository.addDocument(
      profile.id,
      data.name,
      data.fileKey,
      data.fileUrl,
      data.fileSize,
      data.mimeType
    );

    await authRepository.createActivityLog(
      userId,
      'VENDOR_DOCUMENT_UPLOAD',
      `Uploaded document: ${data.name}`,
      ip,
      userAgent
    );

    return document;
  }

  async deleteDocument(userId: string, documentId: string, ip?: string, userAgent?: string) {
    const profile = await this.getProfileByUserId(userId);
    const document = await vendorRepository.getDocumentById(documentId);

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    if (document.vendorProfileId !== profile.id) {
      throw new AppError('Unauthorized access to document', 403);
    }

    // Delete from underlying storage (Local storage or S3)
    await storageService.deleteFile(document.fileKey);

    // Delete from database
    await vendorRepository.deleteDocument(documentId);

    await authRepository.createActivityLog(
      userId,
      'VENDOR_DOCUMENT_DELETE',
      `Deleted document: ${document.name}`,
      ip,
      userAgent
    );
  }

  async saveLocalFile(fileKey: string, buffer: Buffer) {
    return storageService.saveLocalFile(fileKey, buffer);
  }
}

export const vendorService = new VendorService();
