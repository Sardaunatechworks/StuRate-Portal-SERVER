import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getCourses, createCourse, updateCourse, deleteCourse,
  getStudents, createStudent, updateStudent, deleteStudent,
  getLecturers, createLecturer, updateLecturer, deleteLecturer,
  getAssignments, createAssignment, deleteAssignment,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
  getEvaluationPeriods, createEvaluationPeriod, toggleEvaluationPeriod
} from '../controllers/admin.controller';

const router = Router();

// Protect all admin routes
router.use(authenticateJWT, authorizeRoles('ADMIN'));

// Departments
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Courses
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Students
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Lecturers
router.get('/lecturers', getLecturers);
router.post('/lecturers', createLecturer);
router.put('/lecturers/:id', updateLecturer);
router.delete('/lecturers/:id', deleteLecturer);

// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.delete('/assignments/:id', deleteAssignment);

// Questions
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Evaluation Periods
router.get('/evaluation-periods', getEvaluationPeriods);
router.post('/evaluation-periods', createEvaluationPeriod);
router.patch('/evaluation-periods/:id/toggle', toggleEvaluationPeriod);

export default router;
