import { Semester } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class AssignmentService {
  static async getAll(filters?: {
    lecturerId?: string;
    courseId?: string;
    academicSession?: string;
    semester?: Semester;
    departmentId?: string;
  }) {
    const where: any = {};
    if (filters?.lecturerId) where.lecturerId = filters.lecturerId;
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.academicSession) where.academicSession = filters.academicSession;
    if (filters?.semester) where.semester = filters.semester;
    if (filters?.departmentId) {
      where.course = { departmentId: filters.departmentId };
    }

    return prisma.courseAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lecturer: {
          include: {
            user: { select: { name: true, email: true } },
            department: true,
          },
        },
        course: {
          include: { department: true },
        },
        _count: {
          select: { evaluations: true },
        },
      },
    });
  }

  static async getById(id: string) {
    const assignment = await prisma.courseAssignment.findUnique({
      where: { id },
      include: {
        lecturer: {
          include: { user: true, department: true },
        },
        course: {
          include: { department: true },
        },
        _count: {
          select: { evaluations: true },
        },
      },
    });
    if (!assignment) throw new AppError('Course assignment not found.', 404);
    return assignment;
  }

  static async create(data: {
    lecturerId: string;
    courseId: string;
    academicSession: string;
    semester: Semester;
  }) {
    // Check if lecturer exists
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: data.lecturerId },
    });
    if (!lecturer) throw new AppError('Lecturer does not exist.', 404);

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new AppError('Course does not exist.', 404);

    // Prevent duplicate assignment
    const existing = await prisma.courseAssignment.findUnique({
      where: {
        lecturerId_courseId_academicSession_semester: {
          lecturerId: data.lecturerId,
          courseId: data.courseId,
          academicSession: data.academicSession,
          semester: data.semester,
        },
      },
    });
    if (existing) {
      throw new AppError(
        'This lecturer is already assigned to this course for the selected session and semester.',
        409
      );
    }

    return prisma.courseAssignment.create({
      data: {
        lecturerId: data.lecturerId,
        courseId: data.courseId,
        academicSession: data.academicSession,
        semester: data.semester,
      },
      include: {
        lecturer: {
          include: { user: { select: { name: true, email: true } }, department: true },
        },
        course: {
          include: { department: true },
        },
      },
    });
  }

  static async delete(id: string) {
    const assignment = await this.getById(id);

    // If evaluations already submitted, do not delete
    const evaluationsCount = await prisma.evaluation.count({
      where: { courseAssignmentId: id },
    });
    if (evaluationsCount > 0) {
      throw new AppError(
        'Cannot remove course assignment because student evaluations have already been submitted for it.',
        400
      );
    }

    await prisma.courseAssignment.delete({ where: { id } });
    return { message: 'Course assignment removed successfully.' };
  }
}
