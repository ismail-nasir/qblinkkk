
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole, asyncHandler } from '../middleware';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(['admin', 'superadmin']));

adminRouter.get('/users', asyncHandler(AdminController.getAllUsers));
adminRouter.get('/system-logs', asyncHandler(AdminController.getSystemLogs));
adminRouter.get('/logs', asyncHandler(AdminController.getAuditLogs));
adminRouter.post('/log', asyncHandler(AdminController.logAction));
adminRouter.get('/list', asyncHandler(AdminController.getAdmins));
adminRouter.post('/add', asyncHandler(AdminController.addAdmin));
adminRouter.post('/remove', asyncHandler(AdminController.removeAdmin));
