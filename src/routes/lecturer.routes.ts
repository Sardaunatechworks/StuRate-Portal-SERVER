import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import {
  getLecturerDashboard,
  getLecturerSummary,
  getLecturerComments,
  updateLecturerProfile
} from '../controllers/lecturer.controller';

const router = Router();

router.use(authenticateJWT, authorizeRoles('LECTURER'));

router.get('/dashboard', getLecturerDashboard);
router.get('/summary', getLecturerSummary);
router.get('/comments', getLecturerComments);
router.put('/profile', updateLecturerProfile);

export default router;
