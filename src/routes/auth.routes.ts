import { Router } from 'express';
import { login, logout, getMe, registerStudent, getPublicDepartments } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/signup/student', registerStudent);
router.get('/departments', getPublicDepartments);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);

export default router;

