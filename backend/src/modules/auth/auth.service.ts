import { authRepository } from './auth.repository';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import { AppError } from '../../middleware/error.middleware';
import crypto from 'crypto';
import logger from '../../config/logger';

export class AuthService {
  async signupVendor(data: any, ip?: string, userAgent?: string) {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      await authRepository.createActivityLog(null, 'FAILED_REGISTRATION', `Email ${data.email} already registered`, ip, userAgent);
      throw new AppError('Email address is already in use', 400);
    }

    const passwordHash = await hashPassword(data.password);

    // Calculate initial profile completion percentage (services count = 0 initially)
    const initialCompletion = calculateProfileCompletion({
      vendorType: data.vendorType,
      ownerName: null,
      phone: null,
      address: null,
      city: null,
      country: data.country || null,
      companyName: data.companyName,
      tradeLicenseNo: null,
      taxRegistrationNo: null,
      serviceCount: 0,
    });

    const userData = {
      email: data.email,
      password: passwordHash,
    };

    const vendorProfileData = {
      vendorType: data.vendorType,
      companyName: data.companyName,
      tradeLicenseNo: null,
      taxRegistrationNo: null,
      ownerName: null,
      phone: null,
      website: null,
      address: null,
      city: null,
      country: data.country || null,
      businessCategory: data.businessCategory,
      profileCompletion: initialCompletion,
    };

    const user = await authRepository.createUser(userData, vendorProfileData);

    await authRepository.createActivityLog(
      user.id,
      'VENDOR_REGISTRATION',
      `Registered vendor user ${data.email}`,
      ip,
      userAgent
    );

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async loginUser(data: any, ip?: string, userAgent?: string) {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      await authRepository.createActivityLog(null, 'FAILED_LOGIN', `Invalid email ${data.email}`, ip, userAgent);
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      await authRepository.createActivityLog(null, 'FAILED_LOGIN', `Invalid password for ${data.email}`, ip, userAgent);
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Expiry: 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await authRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

    await authRepository.createActivityLog(
      user.id,
      'USER_LOGIN',
      `User ${data.email} logged in successfully`,
      ip,
      userAgent
    );

    const { password, ...userWithoutPassword } = user;
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async logoutUser(token: string, ip?: string, userAgent?: string) {
    const session = await authRepository.findRefreshToken(token);
    if (session) {
      await authRepository.deleteRefreshToken(token);
      await authRepository.createActivityLog(
        session.userId,
        'USER_LOGOUT',
        'Logged out successfully',
        ip,
        userAgent
      );
    }
  }

  async refreshToken(token: string, ip?: string, userAgent?: string) {
    const session = await authRepository.findRefreshToken(token);
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await authRepository.deleteRefreshToken(token);
      }
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Refresh token rotation
    const decoded = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken({ userId: session.userId, role: session.user.role });
    const newRefreshToken = generateRefreshToken({ userId: session.userId });

    // Delete old and save new
    await authRepository.deleteRefreshToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await authRepository.saveRefreshToken(session.userId, newRefreshToken, expiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email: string, ip?: string, userAgent?: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      logger.info(`Forgot password requested for non-existing email: ${email}`);
      return { success: true, message: 'If that email is registered, a password reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await authRepository.createPasswordResetToken(user.id, token, expiresAt);

    await authRepository.createActivityLog(
      user.id,
      'PASSWORD_RESET_REQUESTED',
      'Password reset request submitted',
      ip,
      userAgent
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    logger.info(`Password reset link generated: ${resetLink}`);

    return {
      success: true,
      message: 'If that email is registered, a password reset link has been sent',
      token, // Return token directly for test purposes as approved
    };
  }

  async resetPassword(data: any, ip?: string, userAgent?: string) {
    const tokenRecord = await authRepository.findPasswordResetToken(data.token);
    if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
      throw new AppError('Invalid, used, or expired reset token', 400);
    }

    const passwordHash = await hashPassword(data.newPassword);
    await authRepository.updateUserPassword(tokenRecord.userId, passwordHash);
    await authRepository.markPasswordResetTokenAsUsed(tokenRecord.id);

    // Delete all refresh tokens to force re-login
    await authRepository.deleteRefreshTokensForUser(tokenRecord.userId);

    await authRepository.createActivityLog(
      tokenRecord.userId,
      'PASSWORD_RESET_SUCCESS',
      'Password reset completed successfully',
      ip,
      userAgent
    );
  }

  async changePassword(userId: string, data: any, ip?: string, userAgent?: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await comparePassword(data.oldPassword, user.password);
    if (!isValid) {
      await authRepository.createActivityLog(userId, 'FAILED_PASSWORD_CHANGE', 'Incorrect old password', ip, userAgent);
      throw new AppError('Incorrect old password', 400);
    }

    const passwordHash = await hashPassword(data.newPassword);
    await authRepository.updateUserPassword(userId, passwordHash);

    // Force re-login
    await authRepository.deleteRefreshTokensForUser(userId);

    await authRepository.createActivityLog(
      userId,
      'PASSWORD_CHANGED',
      'Password changed successfully',
      ip,
      userAgent
    );
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
export const authService = new AuthService();
