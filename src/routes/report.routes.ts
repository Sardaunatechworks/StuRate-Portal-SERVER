import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { getSystemAnalytics, getDepartmentReports } from '../controllers/report.controller';

const router = Router();

router.use(authenticateJWT, authorizeRoles('ADMIN'));

router.get('/analytics', getSystemAnalytics);
router.get('/reports/departments', getDepartmentReports);

export default router;
