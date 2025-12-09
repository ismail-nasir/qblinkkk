
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, asyncHandler } from '../middleware';

export const authRouter = Router();

// Public Routes
authRouter.post('/signup', asyncHandler(AuthController.signup));
authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/verify', asyncHandler(AuthController.verify));
authRouter.post('/resend-verification', asyncHandler(AuthController.resendVerification));
authRouter.post('/forgot-password', asyncHandler(AuthController.forgotPassword));
authRouter.post('/reset-password', asyncHandler(AuthController.resetPassword));

// Protected Routes
authRouter.post('/logout', asyncHandler(AuthController.logout));
authRouter.delete('/me', authenticate, asyncHandler(AuthController.deleteAccount));
