import { Router } from 'express';
import { PeriodController } from '../controllers/period.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  evaluationPeriodSchema,
  updateEvaluationPeriodStatusSchema,
} from '../validators/evaluation.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', PeriodController.getAll);
router.get('/active', PeriodController.getActive);
router.get('/:id', PeriodController.getById);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(evaluationPeriodSchema),
  PeriodController.create
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  PeriodController.update
);

router.patch(
  '/:id/status',
  authorize(Role.ADMIN),
  validate(updateEvaluationPeriodStatusSchema),
  PeriodController.setStatus
);

export default router;
