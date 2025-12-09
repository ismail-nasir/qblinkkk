
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, asyncHandler } from '../middleware';

export const authRouter = Router();

authRouter.post('/signup', asyncHandler(AuthController.signup));
authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/logout', asyncHandler(AuthController.logout));
authRouter.delete('/me', authenticate, asyncHandler(AuthController.deleteAccount));
// Stubs for verification flow
authRouter.post('/verify', asyncHandler(AuthController.verify));
authRouter.post('/resend-verification', asyncHandler(AuthController.resendVerification));
authRouter.post('/forgot-password', asyncHandler(AuthController.forgotPassword));
authRouter.post('/reset-password', asyncHandler(AuthController.resetPassword));
