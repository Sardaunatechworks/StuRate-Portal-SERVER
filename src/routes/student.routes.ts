import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import {
  getStudentDashboard,
  getStudentCourses,
  submitEvaluation,
  getStudentEvaluationsHistory,
  updateStudentProfile,
  getEvaluationQuestions
} from '../controllers/student.controller';

const router = Router();

router.use(authenticateJWT, authorizeRoles('STUDENT'));

router.get('/dashboard', getStudentDashboard);
router.get('/courses', getStudentCourses);
router.get('/questions', getEvaluationQuestions);
router.post('/evaluations', submitEvaluation);
router.get('/evaluations/history', getStudentEvaluationsHistory);
router.put('/profile', updateStudentProfile);

export default router;
