import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';

export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: { department: true }
    });

    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { isActive: true }
    });

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        courseAssignment: {
          include: {
            course: true,
            lecturer: { include: { user: true, department: true } }
          }
        }
      }
    });

    let completedCount = 0;
    let pendingCount = enrollments.length;

    if (activePeriod) {
      const submittedEvaluations = await prisma.evaluation.findMany({
        where: {
          studentId: student.id,
          evaluationPeriodId: activePeriod.id
        },
        select: { courseAssignmentId: true }
      });

      const submittedAssignmentIds = new Set(submittedEvaluations.map((e: any) => e.courseAssignmentId));
      completedCount = submittedEvaluations.length;
      pendingCount = Math.max(0, enrollments.length - completedCount);
    }

    res.json({
      student,
      activePeriod,
      totalAssignedCourses: enrollments.length,
      completedEvaluations: completedCount,
      pendingEvaluations: pendingCount,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching student dashboard', error: error.message });
  }
};

export const getStudentCourses = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { isActive: true }
    });

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        courseAssignment: {
          include: {
            course: { include: { department: true } },
            lecturer: { include: { user: true, department: true } },
            evaluations: activePeriod ? {
              where: {
                studentId: student.id,
                evaluationPeriodId: activePeriod.id
              }
            } : false
          }
        }
      }
    });

    const coursesWithStatus = enrollments.map((e: any) => {
      const isEvaluated = activePeriod && e.courseAssignment.evaluations && e.courseAssignment.evaluations.length > 0;
      return {
        enrollmentId: e.id,
        courseAssignmentId: e.courseAssignment.id,
        courseCode: e.courseAssignment.course.code,
        courseTitle: e.courseAssignment.course.title,
        creditUnit: e.courseAssignment.course.creditUnit,
        department: e.courseAssignment.course.department.name,
        lecturerName: `${e.courseAssignment.lecturer.title} ${e.courseAssignment.lecturer.user.name}`,
        lecturerStaffId: e.courseAssignment.lecturer.staffId,
        academicSession: e.courseAssignment.academicSession,
        semester: e.courseAssignment.semester,
        isEvaluated: Boolean(isEvaluated),
        evaluationId: isEvaluated ? e.courseAssignment.evaluations[0].id : null
      };
    });

    res.json({
      activePeriod,
      courses: coursesWithStatus
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching student courses', error: error.message });
  }
};

export const submitEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { courseAssignmentId, comment, ratings } = req.body;
    // ratings should be array of { questionId, rating (1-5) }

    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { isActive: true }
    });

    if (!activePeriod) {
      return res.status(400).json({ message: 'Evaluation period is not currently active.' });
    }

    // Check duplicate evaluation
    const existing = await prisma.evaluation.findUnique({
      where: {
        studentId_courseAssignmentId_evaluationPeriodId: {
          studentId: student.id,
          courseAssignmentId,
          evaluationPeriodId: activePeriod.id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already submitted an evaluation for this lecturer and course in the current active period.' });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        courseAssignmentId,
        studentId: student.id,
        evaluationPeriodId: activePeriod.id,
        comment,
        ratings: {
          create: ratings.map((r: { questionId: string; rating: number }) => ({
            questionId: r.questionId,
            rating: Number(r.rating)
          }))
        }
      },
      include: {
        ratings: true
      }
    });

    res.status(201).json({
      message: 'Evaluation submitted successfully. Thank you for your feedback!',
      evaluationId: evaluation.id
    });
  } catch (error: any) {
    res.status(400).json({ message: 'Error submitting evaluation', error: error.message });
  }
};

export const getStudentEvaluationsHistory = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const history = await prisma.evaluation.findMany({
      where: { studentId: student.id },
      include: {
        evaluationPeriod: true,
        courseAssignment: {
          include: {
            course: true,
            lecturer: { include: { user: true } }
          }
        },
        ratings: {
          include: { question: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedHistory = history.map((ev: any) => {
      const totalScore = ev.ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
      const avgScore = ev.ratings.length > 0 ? (totalScore / ev.ratings.length).toFixed(1) : 'N/A';
      return {
        id: ev.id,
        courseCode: ev.courseAssignment.course.code,
        courseTitle: ev.courseAssignment.course.title,
        lecturerName: `${ev.courseAssignment.lecturer.title} ${ev.courseAssignment.lecturer.user.name}`,
        periodTitle: ev.evaluationPeriod.title,
        comment: ev.comment,
        averageRating: avgScore,
        submittedAt: ev.createdAt
      };
    });

    res.json(formattedHistory);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching evaluation history', error: error.message });
  }
};

export const updateStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
};

export const getEvaluationQuestions = async (_req: AuthRequest, res: Response) => {
  try {
    const questions = await prisma.evaluationQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching evaluation questions', error: error.message });
  }
};

