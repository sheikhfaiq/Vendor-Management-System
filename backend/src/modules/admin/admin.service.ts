import { adminRepository } from './admin.repository';
import { authRepository } from '../auth/auth.repository';
import { AppError } from '../../middleware/error.middleware';
import { PaginationParams, formatPaginatedResult } from '../../utils/pagination';
import { VendorStatus } from '@prisma/client';

export class AdminService {
  async getDashboardStats() {
    return adminRepository.getDashboardStats();
  }

  async listVendors(params: PaginationParams) {
    const [vendors, total] = await Promise.all([
      adminRepository.listVendors(params.skip, params.limit),
      adminRepository.countVendors(),
    ]);
    return formatPaginatedResult(vendors, total, params);
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
}

export const adminService = new AdminService();
