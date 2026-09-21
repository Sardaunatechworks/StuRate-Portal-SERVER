import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get('/dashboard', ReportController.getAdminDashboard);
router.get('/reports', ReportController.getAdminReports);

export default router;
