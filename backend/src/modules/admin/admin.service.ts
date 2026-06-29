import { adminRepository } from './admin.repository';
import { authRepository } from '../auth/auth.repository';
import { AppError } from '../../middleware/error.middleware';
import { PaginationParams, formatPaginatedResult } from '../../utils/pagination';
import { VendorStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import { notificationService } from '../notification/notification.service';

export class AdminService {
  async getDashboardStats() {
    return adminRepository.getDashboardStats();
  }

  async listVendors(params: PaginationParams, status?: string) {
    const [vendors, total] = await Promise.all([
      adminRepository.listVendors(params.skip, params.limit, status),
      adminRepository.countVendors(status),
    ]);
    return formatPaginatedResult(vendors, total, params);
  }

  async listAllDocuments(params: PaginationParams, vendorId?: string) {
    const { docs, total } = await adminRepository.getAllDocuments(params.skip, params.limit, vendorId);
    return formatPaginatedResult(docs, total, params);
  }

  async getVendorById(id: string) {
    const vendor = await adminRepository.getVendorById(id);
    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }
    return vendor;
  }

  async updateVendorStatus(
    adminId: string,
    vendorId: string,
    status: VendorStatus,
    ip?: string,
    userAgent?: string
  ) {
    const vendor = await adminRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    const updatedVendor = await adminRepository.updateVendorStatus(vendorId, status);

    await authRepository.createActivityLog(
      adminId,
      'VENDOR_STATUS_CHANGE',
      `Changed vendor status of ${updatedVendor.user.email} (ID: ${vendorId}) to ${status}`,
      ip,
      userAgent
    );

    if (status === 'APPROVED') {
      await notificationService.createNotification(
        'Onboarding Approved',
        'Your profile has been approved! You now have full access to select and register services.',
        updatedVendor.userId
      );
    } else if (status === 'REJECTED') {
      await notificationService.createNotification(
        'Registration Rejected',
        'Your onboarding application was rejected. Please review and correct your details.',
        updatedVendor.userId
      );
    }

    return updatedVendor;
  }

  async searchVendors(query: string, params: PaginationParams) {
    if (!query) {
      return this.listVendors(params);
    }
    const [vendors, total] = await Promise.all([
      adminRepository.searchVendors(query, params.skip, params.limit),
      adminRepository.countSearchVendors(query),
    ]);
    return formatPaginatedResult(vendors, total, params);
  }

  async filterVendors(filters: any, params: PaginationParams) {
    const [vendors, total] = await Promise.all([
      adminRepository.filterVendors(filters, params.skip, params.limit),
      adminRepository.countFilterVendors(filters),
    ]);
    return formatPaginatedResult(vendors, total, params);
  }

  async listUsers(params: PaginationParams) {
    const [users, total] = await Promise.all([
      adminRepository.listUsers(params.skip, params.limit),
      adminRepository.countUsers(),
    ]);
    return formatPaginatedResult(users, total, params);
  }

  async listActivityLogs(params: PaginationParams) {
    const [logs, total] = await Promise.all([
      adminRepository.listActivityLogs(params.skip, params.limit),
      adminRepository.countActivityLogs(),
    ]);
    return formatPaginatedResult(logs, total, params);
  }

  async updateVendorProfile(
    adminId: string,
    vendorId: string,
    data: any,
    ip?: string,
    userAgent?: string
  ) {
    const updatedVendor = await adminRepository.updateVendorProfile(vendorId, data);
    
    await authRepository.createActivityLog(
      adminId,
      'VENDOR_PROFILE_UPDATE',
      `Admin updated vendor profile details of ${updatedVendor.user.email} (ID: ${vendorId})`,
      ip,
      userAgent
    );

    return updatedVendor;
  }

  async addVendorService(
    adminId: string,
    vendorId: string,
    subCategoryId: string,
    scopes: any[],
    ip?: string,
    userAgent?: string
  ) {
    const profile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { services: true, user: { select: { email: true } } },
    });

    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) {
      throw new AppError('Subcategory not found', 404);
    }

    const existing = profile.services.find(s => s.subCategoryId === subCategoryId);
    if (existing) {
      throw new AppError('This service is already registered for this vendor profile', 400);
    }

    const mapping = await prisma.vendorService.create({
      data: {
        vendorProfileId: vendorId,
        subCategoryId,
        scopes,
      },
    });

    // Recalculate completion
    const newServiceCount = profile.services.length + 1;
    const profileCompletion = calculateProfileCompletion({
      ...profile,
      vendorType: profile.vendorType as any,
      serviceCount: newServiceCount,
    });

    await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { profileCompletion },
    });

    await authRepository.createActivityLog(
      adminId,
      'ADMIN_VENDOR_SERVICE_ADDED',
      `Admin added service ${subCategory.name} to vendor profile ${profile.user.email} (ID: ${vendorId})`,
      ip,
      userAgent
    );

    return mapping;
  }

  async updateVendorService(
    adminId: string,
    vendorId: string,
    serviceId: string,
    scopes: any[],
    ip?: string,
    userAgent?: string
  ) {
    const profile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { user: { select: { email: true } } },
    });

    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }

    const mapping = await prisma.vendorService.findUnique({
      where: { id: serviceId },
    });
    if (!mapping || mapping.vendorProfileId !== vendorId) {
      throw new AppError('Vendor service mapping not found for this profile', 404);
    }

    const updated = await prisma.vendorService.update({
      where: { id: serviceId },
      data: { scopes },
    });

    await authRepository.createActivityLog(
      adminId,
      'ADMIN_VENDOR_SERVICE_UPDATED',
      `Admin updated scopes of service mapping ID ${serviceId} for vendor profile ${profile.user.email} (ID: ${vendorId})`,
      ip,
      userAgent
    );

    return updated;
  }

  async deleteVendorService(
    adminId: string,
    vendorId: string,
    serviceId: string,
    ip?: string,
    userAgent?: string
  ) {
    const profile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { services: true, user: { select: { email: true } } },
    });

    if (!profile) {
      throw new AppError('Vendor profile not found', 404);
    }

    const mapping = await prisma.vendorService.findUnique({
      where: { id: serviceId },
    });
    if (!mapping || mapping.vendorProfileId !== vendorId) {
      throw new AppError('Vendor service mapping not found for this profile', 404);
    }

    await prisma.vendorService.delete({
      where: { id: serviceId },
    });

    // Recalculate completion
    const newServiceCount = Math.max(0, profile.services.length - 1);
    const profileCompletion = calculateProfileCompletion({
      ...profile,
      vendorType: profile.vendorType as any,
      serviceCount: newServiceCount,
    });

    await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { profileCompletion },
    });

    await authRepository.createActivityLog(
      adminId,
      'ADMIN_VENDOR_SERVICE_DELETED',
      `Admin deleted service mapping ID ${serviceId} from vendor profile ${profile.user.email} (ID: ${vendorId})`,
      ip,
      userAgent
    );
  }
}

export const adminService = new AdminService();
