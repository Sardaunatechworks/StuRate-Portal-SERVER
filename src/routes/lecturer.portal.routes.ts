import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.LECTURER));

router.get('/dashboard', ReportController.getLecturerDashboard);
router.get('/analytics', ReportController.getLecturerAnalytics);
router.get('/comments', ReportController.getLecturerComments);

export default router;
