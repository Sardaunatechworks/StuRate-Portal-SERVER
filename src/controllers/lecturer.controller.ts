import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';

export const getLecturerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: req.user!.id },
      include: { department: true, user: true }
    });

    if (!lecturer) return res.status(404).json({ message: 'Lecturer profile not found' });

    // Fetch all course assignments for this lecturer
    const assignments = await prisma.courseAssignment.findMany({
      where: { lecturerId: lecturer.id },
      include: {
        course: true,
        evaluations: {
          include: {
            ratings: { include: { question: true } }
          }
        }
      }
    });

    let totalEvaluations = 0;
    let allRatings: number[] = [];
    let recentComments: Array<{ id: string; courseCode: string; comment: string; date: Date }> = [];

    const courseBreakdown = assignments.map((assignment: any) => {
      const evalCount = assignment.evaluations.length;
      totalEvaluations += evalCount;

      const assignmentRatings: number[] = [];
      assignment.evaluations.forEach((ev: any) => {
        if (ev.comment && ev.comment.trim() !== '') {
          recentComments.push({
            id: ev.id,
            courseCode: assignment.course.code,
            comment: ev.comment,
            date: ev.createdAt
          });
        }

        ev.ratings.forEach((r: any) => {
          assignmentRatings.push(r.rating);
          allRatings.push(r.rating);
        });
      });

      const avg = assignmentRatings.length > 0
        ? Number((assignmentRatings.reduce((a, b) => a + b, 0) / assignmentRatings.length).toFixed(2))
        : 0;

      return {
        assignmentId: assignment.id,
        courseCode: assignment.course.code,
        courseTitle: assignment.course.title,
        creditUnit: assignment.course.creditUnit,
        evaluationCount: evalCount,
        averageRating: avg
      };
    });

    const overallAverage = allRatings.length > 0
      ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2))
      : 0;

    recentComments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      lecturer: {
        id: lecturer.id,
        title: lecturer.title,
        name: lecturer.user.name,
        staffId: lecturer.staffId,
        department: lecturer.department.name
      },
      overallAverageRating: overallAverage,
      totalEvaluations,
      assignedCoursesCount: assignments.length,
      courseBreakdown,
      recentComments: recentComments.slice(0, 10) // Strictly anonymous!
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching lecturer dashboard', error: error.message });
  }
};

export const getLecturerSummary = async (req: AuthRequest, res: Response) => {
  try {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: req.user!.id }
    });

    if (!lecturer) return res.status(404).json({ message: 'Lecturer profile not found' });

    const assignments = await prisma.courseAssignment.findMany({
      where: { lecturerId: lecturer.id },
      include: {
        course: true,
        evaluations: {
          include: {
            ratings: { include: { question: true } }
          }
        }
      }
    });

    // Question-by-question breakdown
    const questions = await prisma.evaluationQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    const questionStats = questions.map((q: any) => {
      const ratingsForQuestion: number[] = [];

      assignments.forEach((a: any) => {
        a.evaluations.forEach((ev: any) => {
          const match = ev.ratings.find((r: any) => r.questionId === q.id);
          if (match) ratingsForQuestion.push(match.rating);
        });
      });

      const avg = ratingsForQuestion.length > 0
        ? Number((ratingsForQuestion.reduce((a, b) => a + b, 0) / ratingsForQuestion.length).toFixed(2))
        : 0;

      // Count distribution (1 to 5 stars)
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingsForQuestion.forEach(r => {
        if (r >= 1 && r <= 5) distribution[r as keyof typeof distribution]++;
      });

      return {
        questionId: q.id,
        questionText: q.questionText,
        category: q.category,
        order: q.order,
        averageRating: avg,
        responseCount: ratingsForQuestion.length,
        distribution
      };
    });

    res.json({
      questionStats
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching rating summary', error: error.message });
  }
};

export const getLecturerComments = async (req: AuthRequest, res: Response) => {
  try {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: req.user!.id }
    });

    if (!lecturer) return res.status(404).json({ message: 'Lecturer profile not found' });

    const assignments = await prisma.courseAssignment.findMany({
      where: { lecturerId: lecturer.id },
      include: {
        course: true,
        evaluations: {
          where: {
            comment: { not: null }
          },
          include: {
            evaluationPeriod: true
          }
        }
      }
    });

    const commentsList: Array<{
      id: string;
      courseCode: string;
      courseTitle: string;
      period: string;
      comment: string;
      createdAt: Date;
    }> = [];

    assignments.forEach((a: any) => {
      a.evaluations.forEach((ev: any) => {
        if (ev.comment && ev.comment.trim() !== '') {
          commentsList.push({
            id: ev.id,
            courseCode: a.course.code,
            courseTitle: a.course.title,
            period: ev.evaluationPeriod.title,
            comment: ev.comment,
            createdAt: ev.createdAt
          });
        }
      });
    });

    commentsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(commentsList);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

export const updateLecturerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, title } = req.body;
    const lecturer = await prisma.lecturer.findUnique({ where: { userId: req.user!.id } });
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user!.id },
        data: { name, email }
      }),
      prisma.lecturer.update({
        where: { id: lecturer.id },
        data: { title }
      })
    ]);

    res.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating lecturer profile', error: error.message });
  }
};
