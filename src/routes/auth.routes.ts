import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { DepartmentController } from '../controllers/department.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/signup/student', AuthController.signupStudent);
router.get('/departments', DepartmentController.getAll);
router.get('/me', authenticate, AuthController.getMe);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  AuthController.updateProfile
);

export default router;
