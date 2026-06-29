import { vendorRepository } from './vendor.repository';
import { serviceRepository } from '../service/service.repository';
import { authRepository } from '../auth/auth.repository';
import { calculateProfileCompletion, getMissingProfileFields } from '../../utils/profileCompletion';
import { AppError } from '../../middleware/error.middleware';
import { ScopeOfWork } from '@prisma/client';
import { storageService } from '../../utils/storage.service';
import { notificationService } from '../notification/notification.service';

const PROFESSION_MAIN_CATEGORIES: Record<string, string[]> = {
  ENGINEER: [
    'Civil Works',
    'Structural Steel Works',
    'MEP',
    'Building Envelope',
    'Infrastructure Works',
    'Temporary Works',
    'Finishing Works (Civil Scope)',
    'Specialized Systems by Project Type'
  ],
  SUPERVISOR: [
    'Civil Works',
    'Structural Steel Works',
    'MEP',
    'Building Envelope',
    'Infrastructure Works',
    'Temporary Works',
    'Finishing Works (Civil Scope)',
    'Specialized Systems by Project Type'
  ],
  FOREMAN: [
    'Civil Works',
    'Structural Steel Works',
    'MEP',
    'Building Envelope',
    'Temporary Works',
    'Finishing Works (Civil Scope)'
  ],
  TECHNICIAN: [
    'Structural Steel Works',
    'MEP',
    'Building Envelope',
    'Temporary Works',
    'Finishing Works (Civil Scope)'
  ],
  LABOUR: [
    'Temporary Works',
    'Finishing Works (Civil Scope)'
  ]
};

const getPermittedMainCategories = (profession: string | null | undefined): string[] => {
  if (!profession) return PROFESSION_MAIN_CATEGORIES.LABOUR;
  const norm = profession.toUpperCase().trim();
  if (norm.includes('ENGINEER')) return PROFESSION_MAIN_CATEGORIES.ENGINEER;
  if (norm.includes('SUPERVISOR')) return PROFESSION_MAIN_CATEGORIES.SUPERVISOR;
  if (norm.includes('FOREMAN') || norm.includes('FORMAN')) return PROFESSION_MAIN_CATEGORIES.FOREMAN;
  if (norm.includes('TECHNICIAN')) return PROFESSION_MAIN_CATEGORIES.TECHNICIAN;
  if (norm.includes('LABOUR') || norm.includes('LABOR')) return PROFESSION_MAIN_CATEGORIES.LABOUR;
  return PROFESSION_MAIN_CATEGORIES.LABOUR;
};

const getPermittedScopes = (profession: string | null | undefined): ScopeOfWork[] => {
  if (!profession) return ['INSTALLATION'];
  const norm = profession.toUpperCase().trim();
  if (norm.includes('ENGINEER')) {
    return ['DESIGN_ENGINEERING', 'SUPPLY', 'INSTALLATION', 'TESTING_COMMISSIONING'];
  }
  if (norm.includes('SUPERVISOR')) {
    return ['SUPPLY', 'INSTALLATION', 'TESTING_COMMISSIONING'];
  }
  if (norm.includes('FOREMAN') || norm.includes('FORMAN') || norm.includes('TECHNICIAN')) {
    return ['INSTALLATION', 'TESTING_COMMISSIONING'];
  }
  return ['INSTALLATION'];
};

export class VendorService {
  async getProfileByUserId(userId: string) {
    const profile = await vendorRepository.getProfileByUserId(userId);
    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }
    return profile;
  }

  private checkLock(profile: any) {
    if (profile.status !== 'APPROVED') {
      throw new AppError('Action locked. Your account is pending administrator approval.', 403);
    }
  }

  async updateCombinedProfileCompletion(profileId: string) {
    const profile = await vendorRepository.getProfileById(profileId);
    if (!profile) return;

    // 1. Details score (recompute raw details completion)
    const detailsScore = calculateProfileCompletion(profile as any);

    // 2. Services score (at least 1 service = 100%, else 0%)
    const serviceCount = await vendorRepository.countServicesByVendorId(profile.id);
    const servicesScore = serviceCount > 0 ? 100 : 0;

    // 3. Documents score (6 mandatory documents, each counts for 1/6)
    const documents = await vendorRepository.getDocumentsByProfileId(profile.id);
    const requiredDocTypes = [
      'Trade License',
      'VAT Registration',
      'Saudization Certificate',
      'GOSI Certificate',
      'Chamber of Commerce',
      'Zakat Certificate',
    ];
    const uploadedTypes = documents.map((d: any) => d.name);
    const uploadedCount = requiredDocTypes.filter((type) => uploadedTypes.includes(type)).length;
    const documentsScore = Math.round((uploadedCount / 6) * 100);

    // Overall combined score is the average of the three stages
    const overallScore = Math.round((detailsScore + servicesScore + documentsScore) / 3);

    // Save to database
    await vendorRepository.updateProfileCompletion(profileId, overallScore);
  }

  async updateProfile(userId: string, data: any, ip?: string, userAgent?: string) {
    const profile = await vendorRepository.getProfileByUserId(userId);
    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }
    this.checkLock(profile);

    if (data.expiryDate) {
      data.expiryDate = new Date(data.expiryDate);
    }

    const updatedProfile = await vendorRepository.updateProfile(userId, data);
    await this.updateCombinedProfileCompletion(profile.id);

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
    this.checkLock(profile);

    if (profile.status !== 'APPROVED') {
      throw new AppError('Your profile must be approved by an administrator before registering services.', 403);
    }

    // Verify subcategory exists
    const subCategory = await serviceRepository.findSubCategoryById(subCategoryId) as any;
    if (!subCategory) {
      throw new AppError('Subcategory not found', 404);
    }

    // Individual Vendor Specific Rules
    if (profile.vendorType === 'INDIVIDUAL') {
      // 1. Trade count cap
      const currentCount = await vendorRepository.countServicesByVendorId(profile.id);
      if (currentCount >= 2) {
        throw new AppError('Individual accounts are limited to registering a maximum of 2 trades. Contact support to upgrade your account to corporate.', 403);
      }

      // 2. Main Category restrictions
      const permittedCats = getPermittedMainCategories(profile.businessCategory);
      const mainCatName = subCategory.category?.mainCategory?.name;
      if (!mainCatName || !permittedCats.includes(mainCatName)) {
        throw new AppError(`Your Vendor Role (${profile.businessCategory || 'Labour'}) is restricted from registering services in the "${mainCatName || 'unknown'}" division.`, 403);
      }

      // 3. Scope restrictions
      const permittedScopes = getPermittedScopes(profile.businessCategory);
      const invalidScopes = scopes.filter(s => !permittedScopes.includes(s));
      if (invalidScopes.length > 0) {
        const invalidStr = invalidScopes.map(s => s.replace(/_/g, ' ')).join(', ');
        throw new AppError(`Your Vendor Role (${profile.businessCategory || 'Labour'}) is not permitted to register the following scopes: ${invalidStr}.`, 403);
      }
    }

    // Verify if already mapped
    const existing = await vendorRepository.findVendorServiceByMapping(profile.id, subCategoryId);
    if (existing) {
      throw new AppError('This service is already registered for your profile', 400);
    }

    const mapping = await vendorRepository.addService(profile.id, subCategoryId, scopes);
    await this.updateCombinedProfileCompletion(profile.id);

    await authRepository.createActivityLog(
      userId,
      'VENDOR_SERVICE_ADDED',
      `Added service subcategory: ${subCategory.name}`,
      ip,
      userAgent
    );

    const vendorName = profile.companyName || profile.ownerName || 'Unknown Vendor';
    const scopesStr = scopes.map(s => s.replace(/_/g, ' ')).join(', ');
    await notificationService.createNotification(
      'Service Registered',
      `You added the trade "${subCategory.name}" (Scopes: ${scopesStr}) to your catalog.`,
      userId
    );
    await notificationService.createNotification(
      'Trade Registered',
      `Vendor "${vendorName}" registered the trade "${subCategory.name}" (Scopes: ${scopesStr}) in their catalog.`,
      null,
      'ADMIN'
    );

    return mapping;
  }

  async updateService(userId: string, id: string, scopes: ScopeOfWork[], ip?: string, userAgent?: string) {
    const profile = await this.getProfileByUserId(userId);
    this.checkLock(profile);

    if (profile.status !== 'APPROVED') {
      throw new AppError('Your profile must be approved by an administrator before updating services.', 403);
    }

    const mapping = await vendorRepository.getVendorServiceById(id);
    if (!mapping) {
      throw new AppError('Vendor service mapping not found', 404);
    }

    if (mapping.vendorProfileId !== profile.id) {
      throw new AppError('Forbidden access - service does not belong to you', 403);
    }

    if (profile.vendorType === 'INDIVIDUAL') {
      const permittedScopes = getPermittedScopes(profile.businessCategory);
      const invalidScopes = scopes.filter(s => !permittedScopes.includes(s));
      if (invalidScopes.length > 0) {
        const invalidStr = invalidScopes.map(s => s.replace(/_/g, ' ')).join(', ');
        throw new AppError(`Your Vendor Role (${profile.businessCategory || 'Labour'}) is not permitted to register the following scopes: ${invalidStr}.`, 403);
      }
    }

    const updatedMapping = await vendorRepository.updateService(id, scopes);

    await authRepository.createActivityLog(
      userId,
      'VENDOR_SERVICE_UPDATED',
      `Updated scopes for service mapping ID: ${id}`,
      ip,
      userAgent
    );

    const subCategory = await serviceRepository.findSubCategoryById(mapping.subCategoryId);
    const subCategoryName = subCategory?.name || 'Unknown Trade';
    const vendorName = profile.companyName || profile.ownerName || 'Unknown Vendor';
    const scopesStr = scopes.map(s => s.replace(/_/g, ' ')).join(', ');
    await notificationService.createNotification(
      'Service Scopes Updated',
      `You updated the scopes for trade "${subCategoryName}" to: ${scopesStr}`,
      userId
    );
    await notificationService.createNotification(
      'Trade Scopes Updated',
      `Vendor "${vendorName}" updated the scopes for trade "${subCategoryName}" to: ${scopesStr}`,
      null,
      'ADMIN'
    );

    return updatedMapping;
  }

  async deleteService(userId: string, id: string, ip?: string, userAgent?: string) {
    const profile = await this.getProfileByUserId(userId);
    this.checkLock(profile);

    const mapping = await vendorRepository.getVendorServiceById(id);
    if (!mapping) {
      throw new AppError('Vendor service mapping not found', 404);
    }

    if (mapping.vendorProfileId !== profile.id) {
      throw new AppError('Forbidden access - service does not belong to you', 403);
    }

    const subCategory = await serviceRepository.findSubCategoryById(mapping.subCategoryId);
    const subCategoryName = subCategory?.name || 'Unknown Trade';
    const vendorName = profile.companyName || profile.ownerName || 'Unknown Vendor';

    await vendorRepository.deleteService(id);
    await this.updateCombinedProfileCompletion(profile.id);

    await authRepository.createActivityLog(
      userId,
      'VENDOR_SERVICE_DELETED',
      `Deleted service mapping ID: ${id}`,
      ip,
      userAgent
    );

    await notificationService.createNotification(
      'Service Removed',
      `You removed the trade "${subCategoryName}" from your catalog.`,
      userId
    );
    await notificationService.createNotification(
      'Trade Removed',
      `Vendor "${vendorName}" removed the trade "${subCategoryName}" from their catalog.`,
      null,
      'ADMIN'
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
        isSubmitted: profile.isSubmitted,
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
      ...profile,
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
    data: { name: string; documentNumber?: string; fileKey: string; fileUrl: string; fileSize: number; mimeType: string },
    ip?: string,
    userAgent?: string
  ) {
    const profile = await this.getProfileByUserId(userId);
    this.checkLock(profile);
    
    const document = await vendorRepository.addDocument(
      profile.id,
      data.name,
      data.fileKey,
      data.fileUrl,
      data.fileSize,
      data.mimeType,
      data.documentNumber
    );

    await this.updateCombinedProfileCompletion(profile.id);

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
    this.checkLock(profile);
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

    await this.updateCombinedProfileCompletion(profile.id);

    await authRepository.createActivityLog(
      userId,
      'VENDOR_DOCUMENT_DELETE',
      `Deleted document: ${document.name}`,
      ip,
      userAgent
    );
  }

  async submitProfile(userId: string, ip?: string, userAgent?: string) {
    const profile = await this.getProfileByUserId(userId);
    
    const updatedProfile = await vendorRepository.updateProfile(userId, {
      isSubmitted: true,
      status: 'PENDING',
    });

    await authRepository.createActivityLog(
      userId,
      'VENDOR_PROFILE_SUBMITTED',
      'Submitted vendor profile for compliance review',
      ip,
      userAgent
    );

    await notificationService.createNotification(
      'Profile Submitted',
      'Your vendor profile is completed and submitted for administrative review.',
      userId
    );

    return updatedProfile;
  }

  async saveLocalFile(fileKey: string, buffer: Buffer) {
    return storageService.saveLocalFile(fileKey, buffer);
  }
}

export const vendorService = new VendorService();
