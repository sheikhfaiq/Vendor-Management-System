import { Role } from '@prisma/client';
import prisma from '../../config/prisma';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { vendorProfile: true },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { vendorProfile: true },
    });
  }

  async createUser(userData: any, vendorProfileData: any) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          role: Role.VENDOR,
        },
      });

      const profile = await tx.vendorProfile.create({
        data: {
          userId: user.id,
          vendorType: vendorProfileData.vendorType,
          companyName: vendorProfileData.companyName || null,
          tradeLicenseNo: vendorProfileData.tradeLicenseNo || null,
          taxRegistrationNo: vendorProfileData.taxRegistrationNo || null,
          ownerName: vendorProfileData.ownerName || null,
          phone: vendorProfileData.phone || null,
          website: vendorProfileData.website || null,
          address: vendorProfileData.address || null,
          city: vendorProfileData.city || null,
          country: vendorProfileData.country || null,
          businessCategory: vendorProfileData.businessCategory || null, // classification category
          profileCompletion: vendorProfileData.profileCompletion || 0,
        },
      });

      return { ...user, vendorProfile: profile };
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteRefreshTokensForUser(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findPasswordResetToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async markPasswordResetTokenAsUsed(id: string) {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { used: true },
    });
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }

  async createActivityLog(
    userId: string | null,
    action: string,
    details: string | null,
    ipAddress?: string,
    userAgent?: string
  ) {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
        userAgent,
      },
    });
  }
}
export const authRepository = new AuthRepository();
