import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { courseSchema, updateCourseSchema } from '../validators/academic.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', CourseController.getAll);
router.get('/:id', CourseController.getById);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(courseSchema),
  CourseController.create
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(updateCourseSchema),
  CourseController.update
);

export default router;
