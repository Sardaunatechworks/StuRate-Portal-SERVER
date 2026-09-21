import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { courseAssignmentSchema } from '../validators/academic.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', AssignmentController.getAll);
router.get('/:id', AssignmentController.getById);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(courseAssignmentSchema),
  AssignmentController.create
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  AssignmentController.delete
);

export default router;
