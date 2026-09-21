import { PeriodStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class ReportService {
  /**
   * Lecturer Dashboard Summary
   */
  static async getLecturerDashboard(userId: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId },
      include: {
        department: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!lecturer) throw new AppError('Lecturer profile not found.', 404);

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { status: PeriodStatus.OPEN },
    });

    // Total evaluations received across all periods
    const evaluations = await prisma.evaluation.findMany({
      where: { lecturerId: lecturer.id },
      include: {
        course: true,
        responses: true,
      },
    });

    const totalEvaluations = evaluations.length;

    // Distinct courses evaluated
    const courseIds = new Set(evaluations.map((e) => e.courseId));

    // Calculate overall average rating
    let totalScore = 0;
    let totalResponses = 0;

    evaluations.forEach((evaluation) => {
      evaluation.responses.forEach((res) => {
        totalScore += res.rating;
        totalResponses += 1;
      });
    });

    const overallAverage =
      totalResponses > 0 ? Number((totalScore / totalResponses).toFixed(2)) : 0;

    return {
      lecturer: {
        id: lecturer.id,
        name: lecturer.user.name,
        staffId: lecturer.staffId,
        department: lecturer.department.name,
      },
      activePeriod: activePeriod
        ? {
            id: activePeriod.id,
            title: activePeriod.title,
            academicSession: activePeriod.academicSession,
            semester: activePeriod.semester,
          }
        : null,
      totalEvaluations,
      coursesEvaluatedCount: courseIds.size,
      overallAverage,
    };
  }

  /**
   * Lecturer Comprehensive Analytics
   * Calculates overall average, criteria averages, course breakdown, rating distributions.
   * STICT ANONYMITY: Zero student identity returned.
   */
  static async getLecturerAnalytics(userId: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId },
    });
    if (!lecturer) throw new AppError('Lecturer profile not found.', 404);

    // Fetch all evaluations for this lecturer with responses and questions
    const evaluations = await prisma.evaluation.findMany({
      where: { lecturerId: lecturer.id },
      select: {
        id: true,
        courseId: true,
        course: { select: { id: true, code: true, title: true } },
        evaluationPeriod: {
          select: { id: true, title: true, academicSession: true, semester: true },
        },
        responses: {
          select: {
            rating: true,
            questionId: true,
            question: { select: { id: true, category: true, order: true } },
          },
        },
      },
    });

    const totalEvaluations = evaluations.length;

    if (totalEvaluations === 0) {
      return {
        totalEvaluations: 0,
        overallAverage: 0,
        criteriaAverages: [],
        coursesBreakdown: [],
        ratingDistribution: [
          { rating: 1, count: 0, label: '1 Star (Very Poor)' },
          { rating: 2, count: 0, label: '2 Stars (Poor)' },
          { rating: 3, count: 0, label: '3 Stars (Average)' },
          { rating: 4, count: 0, label: '4 Stars (Good)' },
          { rating: 5, count: 0, label: '5 Stars (Excellent)' },
        ],
      };
    }

    // 1. Overall Score
    let totalScore = 0;
    let totalRatingsCount = 0;

    // 2. Score Distribution (1 to 5)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // 3. Criteria Aggregation
    const criteriaMap = new Map<
      string,
      { category: string; order: number; sum: number; count: number }
    >();

    // 4. Course Breakdown
    const courseMap = new Map<
      string,
      { courseCode: string; courseTitle: string; sum: number; count: number; evalCount: number }
    >();

    evaluations.forEach((ev) => {
      const courseKey = ev.course.id;
      if (!courseMap.has(courseKey)) {
        courseMap.set(courseKey, {
          courseCode: ev.course.code,
          courseTitle: ev.course.title,
          sum: 0,
          count: 0,
          evalCount: 0,
        });
      }
      courseMap.get(courseKey)!.evalCount += 1;

      ev.responses.forEach((resp) => {
        totalScore += resp.rating;
        totalRatingsCount += 1;

        // Distribution count
        if (distribution[resp.rating] !== undefined) {
          distribution[resp.rating] += 1;
        }

        // Course score
        const cData = courseMap.get(courseKey)!;
        cData.sum += resp.rating;
        cData.count += 1;

        // Criteria score
        const qKey = resp.questionId;
        if (!criteriaMap.has(qKey)) {
          criteriaMap.set(qKey, {
            category: resp.question.category,
            order: resp.question.order,
            sum: 0,
            count: 0,
          });
        }
        const qData = criteriaMap.get(qKey)!;
        qData.sum += resp.rating;
        qData.count += 1;
      });
    });

    const overallAverage =
      totalRatingsCount > 0 ? Number((totalScore / totalRatingsCount).toFixed(2)) : 0;

    const criteriaAverages = Array.from(criteriaMap.values())
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        criterion: c.category,
        average: c.count > 0 ? Number((c.sum / c.count).toFixed(2)) : 0,
        responsesCount: c.count,
      }));

    const coursesBreakdown = Array.from(courseMap.values())
      .map((c) => ({
        courseCode: c.courseCode,
        courseTitle: c.courseTitle,
        average: c.count > 0 ? Number((c.sum / c.count).toFixed(2)) : 0,
        evaluationCount: c.evalCount,
      }))
      .sort((a, b) => b.average - a.average);

    const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
      rating: stars,
      count: distribution[stars] || 0,
      label:
        stars === 1
          ? '1 Star (Very Poor)'
          : stars === 2
          ? '2 Stars (Poor)'
          : stars === 3
          ? '3 Stars (Average)'
          : stars === 4
          ? '4 Stars (Good)'
          : '5 Stars (Excellent)',
    }));

    return {
      totalEvaluations,
      overallAverage,
      criteriaAverages,
      coursesBreakdown,
      ratingDistribution,
    };
  }

  /**
   * Lecturer Anonymous Qualitative Comments Feed
   * CRITICAL SECURITY REQUIREMENT: No student identity returned.
   */
  static async getLecturerComments(userId: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId },
    });
    if (!lecturer) throw new AppError('Lecturer profile not found.', 404);

    const comments = await prisma.evaluation.findMany({
      where: {
        lecturerId: lecturer.id,
        comment: { not: null },
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        comment: true,
        submittedAt: true,
        course: {
          select: {
            code: true,
            title: true,
          },
        },
        evaluationPeriod: {
          select: {
            title: true,
            academicSession: true,
            semester: true,
          },
        },
      },
    });

    return comments
      .filter((c) => c.comment && c.comment.trim().length > 0)
      .map((c) => ({
        id: c.id,
        comment: c.comment,
        courseCode: c.course.code,
        courseTitle: c.course.title,
        submittedAt: c.submittedAt,
        session: `${c.evaluationPeriod.academicSession} (${c.evaluationPeriod.semester} Semester)`,
        author: 'Anonymous Student',
      }));
  }

  /**
   * Administrator Institutional Dashboard Metrics
   */
  static async getAdminDashboard() {
    const [
      totalStudents,
      totalLecturers,
      totalDepartments,
      totalCourses,
      totalEvaluations,
      activePeriod,
    ] = await Promise.all([
      prisma.student.count({ where: { user: { isActive: true } } }),
      prisma.lecturer.count({ where: { user: { isActive: true } } }),
      prisma.department.count(),
      prisma.course.count(),
      prisma.evaluation.count(),
      prisma.evaluationPeriod.findFirst({ where: { status: PeriodStatus.OPEN } }),
    ]);

    // Average rating across entire institution
    const allResponses = await prisma.evaluationResponse.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    });

    const institutionAverage = allResponses._avg.rating
      ? Number(allResponses._avg.rating.toFixed(2))
      : 0;

    return {
      totalStudents,
      totalLecturers,
      totalDepartments,
      totalCourses,
      totalEvaluations,
      institutionAverage,
      activePeriod: activePeriod
        ? {
            id: activePeriod.id,
            title: activePeriod.title,
            academicSession: activePeriod.academicSession,
            semester: activePeriod.semester,
            startDate: activePeriod.startDate,
            endDate: activePeriod.endDate,
            status: activePeriod.status,
          }
        : null,
    };
  }

  /**
   * Administrator Reports with Filtering
   */
  static async getAdminReports(filters?: {
    departmentId?: string;
    courseId?: string;
    lecturerId?: string;
    evaluationPeriodId?: string;
  }) {
    const where: any = {};
    if (filters?.evaluationPeriodId) where.evaluationPeriodId = filters.evaluationPeriodId;
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.lecturerId) where.lecturerId = filters.lecturerId;
    if (filters?.departmentId) {
      where.course = { departmentId: filters.departmentId };
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        course: { include: { department: true } },
        lecturer: {
          include: {
            user: { select: { name: true, email: true } },
            department: true,
          },
        },
        evaluationPeriod: true,
        responses: {
          include: { question: true },
        },
      },
    });

    // Compute aggregate metrics
    const lecturerReportMap = new Map<
      string,
      {
        lecturerId: string;
        lecturerName: string;
        staffId: string;
        departmentName: string;
        evaluationCount: number;
        totalScore: number;
        totalResponses: number;
        coursesTaught: Set<string>;
      }
    >();

    evaluations.forEach((ev) => {
      const lId = ev.lecturerId;
      if (!lecturerReportMap.has(lId)) {
        lecturerReportMap.set(lId, {
          lecturerId: lId,
          lecturerName: ev.lecturer.user.name,
          staffId: ev.lecturer.staffId,
          departmentName: ev.lecturer.department.name,
          evaluationCount: 0,
          totalScore: 0,
          totalResponses: 0,
          coursesTaught: new Set<string>(),
        });
      }

      const lData = lecturerReportMap.get(lId)!;
      lData.evaluationCount += 1;
      lData.coursesTaught.add(ev.course.code);

      ev.responses.forEach((res) => {
        lData.totalScore += res.rating;
        lData.totalResponses += 1;
      });
    });

    const lecturerSummaries = Array.from(lecturerReportMap.values()).map((l) => ({
      lecturerId: l.lecturerId,
      lecturerName: l.lecturerName,
      staffId: l.staffId,
      departmentName: l.departmentName,
      evaluationCount: l.evaluationCount,
      coursesCount: l.coursesTaught.size,
      coursesList: Array.from(l.coursesTaught).join(', '),
      averageScore:
        l.totalResponses > 0 ? Number((l.totalScore / l.totalResponses).toFixed(2)) : 0,
    }));

    return {
      totalEvaluationsFound: evaluations.length,
      lecturerSummaries,
    };
  }
}
