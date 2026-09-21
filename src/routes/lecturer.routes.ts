import { Router } from 'express';
import { LecturerController } from '../controllers/lecturer.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { lecturerSchema, updateLecturerSchema } from '../validators/academic.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', LecturerController.getAll);
router.get('/:id', LecturerController.getById);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(lecturerSchema),
  LecturerController.create
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(updateLecturerSchema),
  LecturerController.update
);

export default router;
