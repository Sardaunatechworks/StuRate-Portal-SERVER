import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { evaluationQuestionSchema } from '../validators/evaluation.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Active questions available to student evaluation form
router.get('/active', QuestionController.getActive);

// All questions for Admin management
router.get('/', QuestionController.getAll);
router.get('/:id', QuestionController.getById);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(evaluationQuestionSchema),
  QuestionController.create
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  QuestionController.update
);

export default router;
