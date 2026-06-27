import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.signupVendor(req.body, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Vendor registered successfully', user, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await authService.loginUser(req.body, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Logged in successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken;
      await authService.logoutUser(refreshToken, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body.refreshToken;
      const data = await authService.refreshToken(token, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Token refreshed successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.body.email;
      const result = await authService.forgotPassword(email, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, result.message, { token: result.token });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await authService.changePassword(userId, req.body, req.ip, req.headers['user-agent'] as string);
      sendSuccess(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await authService.getMe(userId);
      sendSuccess(res, 'Fetched current user successfully', user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
