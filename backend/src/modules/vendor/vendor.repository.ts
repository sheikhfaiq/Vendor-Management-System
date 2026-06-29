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
}

export const vendorRepository = new VendorRepository();

