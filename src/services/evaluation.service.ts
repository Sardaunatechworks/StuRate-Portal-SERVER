import { PeriodStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class EvaluationService {
  /**
   * Fetch dashboard summary metrics for a student
   */
  static async getStudentDashboard(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { department: true },
    });
    if (!student) throw new AppError('Student profile not found.', 404);

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { status: PeriodStatus.OPEN },
    });

    if (!activePeriod) {
      const pastEvaluationsCount = await prisma.evaluation.count({
        where: { studentId: student.id },
      });

      return {
        student: {
          id: student.id,
          matricNumber: student.matricNumber,
          department: student.department.name,
          level: student.level,
        },
        activePeriod: null,
        totalEligible: 0,
        completedCount: 0,
        pendingCount: 0,
        allTimeEvaluationsCount: pastEvaluationsCount,
        evaluations: [],
      };
    }

    // Find course assignments matching student's department and current session/semester
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        academicSession: activePeriod.academicSession,
        semester: activePeriod.semester,
        course: {
          departmentId: student.departmentId,
        },
      },
      include: {
        lecturer: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        course: true,
      },
    });

    // Find evaluations already completed by this student during this active period
    const completedEvaluations = await prisma.evaluation.findMany({
      where: {
        studentId: student.id,
        evaluationPeriodId: activePeriod.id,
      },
      select: {
        courseAssignmentId: true,
        submittedAt: true,
      },
    });

    const completedAssignmentIds = new Set(
      completedEvaluations.map((e) => e.courseAssignmentId)
    );

    const evaluationList = assignments.map((a) => ({
      assignmentId: a.id,
      courseCode: a.course.code,
      courseTitle: a.course.title,
      creditUnit: a.course.creditUnit,
      level: a.course.level,
      lecturerName: a.lecturer.user.name,
      academicSession: a.academicSession,
      semester: a.semester,
      isCompleted: completedAssignmentIds.has(a.id),
    }));

    const completedCount = completedAssignmentIds.size;
    const totalEligible = assignments.length;
    const pendingCount = Math.max(0, totalEligible - completedCount);

    return {
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        department: student.department.name,
        level: student.level,
      },
      activePeriod: {
        id: activePeriod.id,
        title: activePeriod.title,
        academicSession: activePeriod.academicSession,
        semester: activePeriod.semester,
        startDate: activePeriod.startDate,
        endDate: activePeriod.endDate,
      },
      totalEligible,
      completedCount,
      pendingCount,
      evaluations: evaluationList,
    };
  }

  /**
   * Get eligible course assignments for evaluation
   */
  static async getEligibleEvaluations(userId: string) {
    const dashboard = await this.getStudentDashboard(userId);
    return dashboard.evaluations;
  }

  /**
   * Get evaluation form details for a specific course assignment
   */
  static async getEvaluationFormDetails(userId: string, assignmentId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found.', 404);

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { status: PeriodStatus.OPEN },
    });
    if (!activePeriod) {
      throw new AppError('There is currently no active evaluation period open.', 400);
    }

    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        lecturer: {
          include: { user: { select: { name: true } }, department: true },
        },
        course: {
          include: { department: true },
        },
      },
    });
    if (!assignment) {
      throw new AppError('Course assignment not found.', 404);
    }

    // Check if student already submitted an evaluation for this assignment
    const alreadyEvaluated = await prisma.evaluation.findUnique({
      where: {
        studentId_courseAssignmentId_evaluationPeriodId: {
          studentId: student.id,
          courseAssignmentId: assignment.id,
          evaluationPeriodId: activePeriod.id,
        },
      },
    });

    if (alreadyEvaluated) {
      throw new AppError(
        'You have already evaluated this lecturer for this course during the active evaluation period.',
        409
      );
    }

    const questions = await prisma.evaluationQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return {
      assignment: {
        id: assignment.id,
        courseCode: assignment.course.code,
        courseTitle: assignment.course.title,
        creditUnit: assignment.course.creditUnit,
        departmentName: assignment.course.department.name,
        lecturerName: assignment.lecturer.user.name,
        academicSession: assignment.academicSession,
        semester: assignment.semester,
      },
      period: {
        id: activePeriod.id,
        title: activePeriod.title,
      },
      questions,
    };
  }

  /**
   * Submit student evaluation with duplicate protection at service and DB level
   */
  static async submitEvaluation(
    userId: string,
    data: {
      courseAssignmentId: string;
      comment?: string;
      ratings: Array<{ questionId: string; rating: number }>;
    }
  ) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found.', 404);

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { status: PeriodStatus.OPEN },
    });
    if (!activePeriod) {
      throw new AppError('Evaluations cannot be submitted: No active evaluation period is open.', 400);
    }

    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: data.courseAssignmentId },
    });
    if (!assignment) {
      throw new AppError('Invalid course assignment.', 404);
    }

    // Check application-level duplicate prevention
    const existing = await prisma.evaluation.findUnique({
      where: {
        studentId_courseAssignmentId_evaluationPeriodId: {
          studentId: student.id,
          courseAssignmentId: assignment.id,
          evaluationPeriodId: activePeriod.id,
        },
      },
    });

    if (existing) {
      throw new AppError(
        'You have already evaluated this lecturer for this course during the active evaluation period.',
        409
      );
    }

    // Validate that all required active questions are answered
    const activeQuestions = await prisma.evaluationQuestion.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const activeQuestionIds = new Set(activeQuestions.map((q) => q.id));
    const submittedQuestionIds = new Set(data.ratings.map((r) => r.questionId));

    for (const qId of activeQuestionIds) {
      if (!submittedQuestionIds.has(qId)) {
        throw new AppError('All evaluation criteria must be rated before submission.', 422);
      }
    }

    for (const item of data.ratings) {
      if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5) {
        throw new AppError('Rating scores must be integers between 1 and 5.', 422);
      }
    }

    // Execute atomic transaction for evaluation header and response rows
    return prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.create({
        data: {
          studentId: student.id,
          lecturerId: assignment.lecturerId,
          courseId: assignment.courseId,
          courseAssignmentId: assignment.id,
          evaluationPeriodId: activePeriod.id,
          comment: data.comment ? data.comment.trim() : null,
        },
      });

      const responseRecords = data.ratings.map((r) => ({
        evaluationId: evaluation.id,
        questionId: r.questionId,
        rating: r.rating,
      }));

      await tx.evaluationResponse.createMany({
        data: responseRecords,
      });

      return {
        id: evaluation.id,
        message: 'Evaluation submitted successfully. Thank you for your feedback.',
      };
    });
  }

  /**
   * View student evaluation history (read-only)
   */
  static async getStudentHistory(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found.', 404);

    const evaluations = await prisma.evaluation.findMany({
      where: { studentId: student.id },
      orderBy: { submittedAt: 'desc' },
      include: {
        course: true,
        lecturer: {
          include: { user: { select: { name: true } } },
        },
        evaluationPeriod: true,
      },
    });

    return evaluations.map((e) => ({
      id: e.id,
      courseCode: e.course.code,
      courseTitle: e.course.title,
      lecturerName: e.lecturer.user.name,
      academicSession: e.evaluationPeriod.academicSession,
      semester: e.evaluationPeriod.semester,
      submittedAt: e.submittedAt,
      periodTitle: e.evaluationPeriod.title,
    }));
  }
}
