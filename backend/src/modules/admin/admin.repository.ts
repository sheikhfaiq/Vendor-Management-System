import { VendorStatus } from '@prisma/client';
import prisma from '../../config/prisma';

export class AdminRepository {
  async getDashboardStats() {
    const [
      totalVendors,
      pendingVendors,
      approvedVendors,
      rejectedVendors,
      totalUsers,
      totalServices,
    ] = await Promise.all([
      prisma.vendorProfile.count(),
      prisma.vendorProfile.count({ where: { status: 'PENDING' } }),
      prisma.vendorProfile.count({ where: { status: 'APPROVED' } }),
      prisma.vendorProfile.count({ where: { status: 'REJECTED' } }),
      prisma.user.count(),
      prisma.vendorService.count(),
    ]);

    return {
      totalVendors,
      pendingVendors,
      approvedVendors,
      rejectedVendors,
      totalUsers,
      totalServices,
    };
  }

  async listVendors(skip: number, limit: number) {
    return prisma.vendorProfile.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countVendors() {
    return prisma.vendorProfile.count();
  }

  async getVendorById(id: string) {
    return prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
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

  async updateVendorStatus(id: string, status: VendorStatus) {
    return prisma.vendorProfile.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  async searchVendors(query: string, skip: number, limit: number) {
    const whereClause = {
      OR: [
        { companyName: { contains: query, mode: 'insensitive' as const } },
        { ownerName: { contains: query, mode: 'insensitive' as const } },
        { phone: { contains: query, mode: 'insensitive' as const } },
        { city: { contains: query, mode: 'insensitive' as const } },
        { country: { contains: query, mode: 'insensitive' as const } },
        {
          user: {
            email: { contains: query, mode: 'insensitive' as const },
          },
        },
      ],
    };

    return prisma.vendorProfile.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countSearchVendors(query: string) {
    return prisma.vendorProfile.count({
      where: {
        OR: [
          { companyName: { contains: query, mode: 'insensitive' as const } },
          { ownerName: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query, mode: 'insensitive' as const } },
          { city: { contains: query, mode: 'insensitive' as const } },
          { country: { contains: query, mode: 'insensitive' as const } },
          {
            user: {
              email: { contains: query, mode: 'insensitive' as const },
            },
          },
        ],
      },
    });
  }

  buildFilterWhereClause(filters: any) {
    const where: any = {};
    const conditions: any[] = [];

    if (filters.subCategoryId) {
      conditions.push({ subCategoryId: { in: filters.subCategoryId.split(',') } });
    }
    if (filters.categoryId) {
      conditions.push({ subCategory: { categoryId: { in: filters.categoryId.split(',') } } });
    }
    if (filters.mainCategoryId) {
      conditions.push({ subCategory: { category: { mainCategoryId: { in: filters.mainCategoryId.split(',') } } } });
    }
    if (filters.scope) {
      conditions.push({ scopes: { has: filters.scope } });
    }

    if (conditions.length > 0) {
      where.services = {
        some: {
          OR: conditions,
        },
      };
    }
    return where;
  }

  async filterVendors(filters: any, skip: number, limit: number) {
    const whereClause = this.buildFilterWhereClause(filters);
    return prisma.vendorProfile.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            email: true,
          },
        },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async countFilterVendors(filters: any) {
    const whereClause = this.buildFilterWhereClause(filters);
    return prisma.vendorProfile.count({
      where: whereClause,
    });
  }

  async listUsers(skip: number, limit: number) {
    return prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        vendorProfile: {
          select: {
            id: true,
            companyName: true,
            ownerName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUsers() {
    return prisma.user.count();
  }

  async listActivityLogs(skip: number, limit: number) {
    return prisma.activityLog.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countActivityLogs() {
    return prisma.activityLog.count();
  }
}

export const adminRepository = new AdminRepository();
