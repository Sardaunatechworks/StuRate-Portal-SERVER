import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import courseRoutes from './course.routes';
import lecturerRoutes from './lecturer.routes';
import studentRoutes from './student.routes';
import assignmentRoutes from './assignment.routes';
import periodRoutes from './period.routes';
import questionRoutes from './question.routes';
import evaluationRoutes from './evaluation.routes';
import lecturerPortalRoutes from './lecturer.portal.routes';
import adminPortalRoutes from './admin.portal.routes';

import { prisma } from '../config/prisma';

const apiRouter = Router();

// Public platform analytics for landing page
apiRouter.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const [totalStudents, totalLecturers, totalCourses, totalEvaluations, ratingAgg] = await Promise.all([
      prisma.student.count(),
      prisma.lecturer.count(),
      prisma.course.count(),
      prisma.evaluation.count(),
      prisma.evaluationResponse.aggregate({ _avg: { rating: true } }),
    ]);

    const avgRating = ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : 0;

    return res.json({
      success: true,
      totalStudents,
      totalLecturers,
      totalCourses,
      totalEvaluations,
      averageRating: avgRating,
      data: {
        totalStudents,
        totalLecturers,
        totalCourses,
        totalEvaluations,
        averageRating: avgRating,
      }
    });
  } catch (error) {
    return res.json({
      success: true,
      totalStudents: 0,
      totalLecturers: 0,
      totalCourses: 0,
      totalEvaluations: 0,
      averageRating: 0,
      data: {
        totalStudents: 0,
        totalLecturers: 0,
        totalCourses: 0,
        totalEvaluations: 0,
        averageRating: 0,
      }
    });
  }
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/lecturers', lecturerRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/course-assignments', assignmentRoutes);
apiRouter.use('/evaluation-periods', periodRoutes);
apiRouter.use('/evaluation-questions', questionRoutes);
apiRouter.use('/student/evaluations', evaluationRoutes);
apiRouter.use('/lecturer', lecturerPortalRoutes);
apiRouter.use('/admin', adminPortalRoutes);

export default apiRouter;
