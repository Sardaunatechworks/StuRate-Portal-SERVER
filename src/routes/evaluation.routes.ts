import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluation.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitEvaluationSchema } from '../validators/evaluation.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.STUDENT));

router.get('/dashboard', EvaluationController.getStudentDashboard);
router.get('/eligible', EvaluationController.getEligibleEvaluations);
router.get('/form/:assignmentId', EvaluationController.getEvaluationFormDetails);
router.post(
  '/',
  validate(submitEvaluationSchema),
  EvaluationController.submitEvaluation
);
router.get('/history', EvaluationController.getStudentHistory);

export default router;
