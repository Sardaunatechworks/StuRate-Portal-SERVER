import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { departmentSchema, updateDepartmentSchema } from '../validators/academic.validator';
import { Role } from '@prisma/client';

const router = Router();

// Public read access for signup and course views
router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);

// Admin-only mutations
router.use(authenticate);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(departmentSchema),
  DepartmentController.create
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(updateDepartmentSchema),
  DepartmentController.update
);

export default router;
