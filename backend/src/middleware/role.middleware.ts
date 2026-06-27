import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from './error.middleware';

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized access', 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('Forbidden access - Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
