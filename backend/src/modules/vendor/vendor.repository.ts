import { ScopeOfWork } from '@prisma/client';
import prisma from '../../config/prisma';

export class VendorRepository {
  async getProfileByUserId(userId: string) {
    return prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        services: {
          include: {
            subCategory: {
              include: {
                category: {
                  include: {
                    mainCategory: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateProfile(userId: string, data: any) {
    return prisma.vendorProfile.update({
      where: { userId },
      data,
    });
  }

  async getProfileById(id: string) {
    return prisma.vendorProfile.findUnique({
      where: { id },
    });
  }

  async updateProfileCompletion(id: string, profileCompletion: number) {
    return prisma.vendorProfile.update({
      where: { id },
      data: { profileCompletion },
    });
  }

  async getServicesByVendorId(vendorProfileId: string) {
    return prisma.vendorService.findMany({
      where: { vendorProfileId },
      include: {
        subCategory: {
          include: {
            category: {
              include: {
                mainCategory: true,
              },
            },
          },
        },
      },
    });
  }

  async getVendorServiceById(id: string) {
    return prisma.vendorService.findUnique({
      where: { id },
    });
  }

  async findVendorServiceByMapping(vendorProfileId: string, subCategoryId: string) {
    return prisma.vendorService.findUnique({
      where: {
        vendorProfileId_subCategoryId: {
          vendorProfileId,
          subCategoryId,
        },
      },
    });
  }

  async addService(vendorProfileId: string, subCategoryId: string, scopes: ScopeOfWork[]) {
    return prisma.vendorService.create({
      data: {
        vendorProfileId,
        subCategoryId,
        scopes,
      },
    });
  }

  async updateService(id: string, scopes: ScopeOfWork[]) {
    return prisma.vendorService.update({
      where: { id },
      data: { scopes },
    });
  }

  async deleteService(id: string) {
    await prisma.vendorService.delete({
      where: { id },
    });
  }

  async countServicesByVendorId(vendorProfileId: string) {
    return prisma.vendorService.count({
      where: { vendorProfileId },
    });
  }

  async getRecentActivityLogs(userId: string, limit = 5) {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getDocumentsByProfileId(vendorProfileId: string) {
    return prisma.vendorDocument.findMany({
      where: { vendorProfileId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getDocumentById(id: string) {
    return prisma.vendorDocument.findUnique({
      where: { id },
    });
  }

  async addDocument(
    vendorProfileId: string,
    name: string,
    fileKey: string,
    fileUrl: string,
    fileSize: number,
    mimeType: string,
    documentNumber?: string
  ) {
    return prisma.vendorDocument.create({
      data: {
        vendorProfileId,
        name,
        fileKey,
        fileUrl,
        fileSize,
        mimeType,
        documentNumber,
      },
    });
  }

  async deleteDocument(id: string) {
    await prisma.vendorDocument.delete({
      where: { id },
    });
  }

  async getProducts(vendorProfileId: string) {
    return prisma.product.findMany({
      where: { vendorProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(vendorProfileId: string, data: { name: string; brand?: string; description?: string }) {
    return prisma.product.create({
      data: {
        vendorProfileId,
        name: data.name,
        brand: data.brand || null,
        description: data.description || null,
      },
    });
  }

  async deleteProduct(id: string, vendorProfileId: string) {
    return prisma.product.delete({
      where: {
        id,
        vendorProfileId,
      },
    });
  }

  async countProducts(vendorProfileId: string) {
    return prisma.product.count({
      where: { vendorProfileId },
    });
  }

  async getTeamMembers(vendorProfileId: string) {
    return prisma.teamMember.findMany({
      where: { vendorProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamMemberById(id: string, vendorProfileId: string) {
    return prisma.teamMember.findFirst({
      where: { id, vendorProfileId },
    });
  }

  async createTeamMember(vendorProfileId: string, data: any) {
    return prisma.teamMember.create({
      data: {
        vendorProfileId,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        assetName: data.assetName || null,
        iqamaNumber: data.iqamaNumber || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        nationality: data.nationality || null,
        bloodGroup: data.bloodGroup || null,
        gosiCertificateNo: data.gosiCertificateNo || null,
        insurancePolicyNo: data.insurancePolicyNo || null,
        iqamaProfession: data.iqamaProfession || null,
        iqamaCompanyName: data.iqamaCompanyName || null,
      },
    });
  }

  async updateTeamMember(id: string, vendorProfileId: string, data: any) {
    return prisma.teamMember.update({
      where: { id, vendorProfileId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email !== undefined ? (data.email || null) : undefined,
        assetName: data.assetName !== undefined ? (data.assetName || null) : undefined,
        iqamaNumber: data.iqamaNumber !== undefined ? (data.iqamaNumber || null) : undefined,
        expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
        nationality: data.nationality !== undefined ? (data.nationality || null) : undefined,
        bloodGroup: data.bloodGroup !== undefined ? (data.bloodGroup || null) : undefined,
        gosiCertificateNo: data.gosiCertificateNo !== undefined ? (data.gosiCertificateNo || null) : undefined,
        insurancePolicyNo: data.insurancePolicyNo !== undefined ? (data.insurancePolicyNo || null) : undefined,
        iqamaProfession: data.iqamaProfession !== undefined ? (data.iqamaProfession || null) : undefined,
        iqamaCompanyName: data.iqamaCompanyName !== undefined ? (data.iqamaCompanyName || null) : undefined,
      },
    });
  }

  async deleteTeamMember(id: string, vendorProfileId: string) {
    return prisma.teamMember.delete({
      where: { id, vendorProfileId },
    });
  }
}

export const vendorRepository = new VendorRepository();

