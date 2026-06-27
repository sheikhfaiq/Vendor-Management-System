import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from './auth.schema';

const router = Router();

router.post('/signup', validate({ body: signupSchema }), authController.signup);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/logout', validate({ body: refreshTokenSchema }), authController.logout);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/refresh-token', validate({ body: refreshTokenSchema }), authController.refreshToken);
router.post('/change-password', authenticate as any, validate({ body: changePasswordSchema }), authController.changePassword as any);
router.get('/me', authenticate as any, authController.getMe as any);

export default router;
