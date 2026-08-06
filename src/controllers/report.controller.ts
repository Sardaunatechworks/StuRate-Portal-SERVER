import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';

export const getSystemAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const totalStudents = await prisma.student.count();
    const totalLecturers = await prisma.lecturer.count();
    const totalCourses = await prisma.course.count();
    const totalDepartments = await prisma.department.count();
    const totalEvaluations = await prisma.evaluation.count();

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { isActive: true }
    });

    const allRatings = await prisma.evaluationRating.findMany({
      select: { rating: true }
    });

    const averageRating = allRatings.length > 0
      ? Number((allRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / allRatings.length).toFixed(2))
      : 0;

    // Top rated lecturers calculation
    const lecturers = await prisma.lecturer.findMany({
      include: {
        user: true,
        department: true,
        courseAssignments: {
          include: {
            evaluations: {
              include: { ratings: true }
            }
          }
        }
      }
    });

    const lecturerStats = lecturers.map((lec: any) => {
      let ratingSum = 0;
      let count = 0;
      let evalSubmissionCount = 0;

      lec.courseAssignments.forEach((ca: any) => {
        evalSubmissionCount += ca.evaluations.length;
        ca.evaluations.forEach((ev: any) => {
          ev.ratings.forEach((r: any) => {
            ratingSum += r.rating;
            count++;
          });
        });
      });

      const avg = count > 0 ? Number((ratingSum / count).toFixed(2)) : 0;

      return {
        id: lec.id,
        name: `${lec.title} ${lec.user.name}`,
        department: lec.department.name,
        staffId: lec.staffId,
        evaluationCount: evalSubmissionCount,
        averageRating: avg
      };
    });

    lecturerStats.sort((a: any, b: any) => b.averageRating - a.averageRating);

    // Rating distribution (1 to 5)
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach((r: any) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
      }
    });

    res.json({
      totalStudents,
      totalLecturers,
      totalCourses,
      totalDepartments,
      totalEvaluations,
      activePeriod,
      averageRating,
      topLecturers: lecturerStats.slice(0, 5),
      allLecturersStats: lecturerStats,
      ratingDistribution
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching system analytics', error: error.message });
  }
};

export const getDepartmentReports = async (_req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        courses: true,
        lecturers: {
          include: {
            courseAssignments: {
              include: {
                evaluations: {
                  include: { ratings: true }
                }
              }
            }
          }
        },
        students: true
      }
    });

    const departmentReports = departments.map((dept: any) => {
      let totalDeptRatings = 0;
      let ratingCount = 0;
      let evaluationSubmissions = 0;

      dept.lecturers.forEach((lec: any) => {
        lec.courseAssignments.forEach((ca: any) => {
          evaluationSubmissions += ca.evaluations.length;
          ca.evaluations.forEach((ev: any) => {
            ev.ratings.forEach((r: any) => {
              totalDeptRatings += r.rating;
              ratingCount++;
            });
          });
        });
      });

      const avgScore = ratingCount > 0 ? Number((totalDeptRatings / ratingCount).toFixed(2)) : 0;

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        totalCourses: dept.courses.length,
        totalLecturers: dept.lecturers.length,
        totalStudents: dept.students.length,
        totalEvaluations: evaluationSubmissions,
        averageRating: avgScore
      };
    });

    res.json(departmentReports);
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating department reports', error: error.message });
  }
};
