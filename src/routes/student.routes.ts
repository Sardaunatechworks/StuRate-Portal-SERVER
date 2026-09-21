import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { studentSchema, updateStudentSchema } from '../validators/academic.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN), StudentController.getAll);
router.get('/:id', authorize(Role.ADMIN), StudentController.getById);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(studentSchema),
  StudentController.create
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(updateStudentSchema),
  StudentController.update
);

export default router;
