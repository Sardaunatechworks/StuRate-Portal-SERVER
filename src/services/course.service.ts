import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class CourseService {
  static async getAll(filters?: { departmentId?: string; level?: number; search?: string }) {
    const where: any = {};
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.level) where.level = filters.level;
    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.course.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        department: true,
        assignments: {
          include: {
            lecturer: {
              include: { user: true },
            },
          },
        },
      },
    });
  }

  static async getById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        assignments: {
          include: {
            lecturer: { include: { user: true } },
          },
        },
      },
    });
    if (!course) throw new AppError('Course not found.', 404);
    return course;
  }

  static async create(data: {
    code: string;
    title: string;
    creditUnit: number;
    departmentId: string;
    level: number;
  }) {
    const existing = await prisma.course.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) {
      throw new AppError(`Course with code "${data.code}" already exists.`, 409);
    }

    return prisma.course.create({
      data: {
        code: data.code.toUpperCase().trim(),
        title: data.title.trim(),
        creditUnit: data.creditUnit,
        departmentId: data.departmentId,
        level: data.level,
      },
      include: { department: true },
    });
  }

  static async update(id: string, data: Partial<{
    code: string;
    title: string;
    creditUnit: number;
    departmentId: string;
    level: number;
  }>) {
    await this.getById(id);
    if (data.code) {
      const existing = await prisma.course.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new AppError(`Course code "${data.code}" is already in use.`, 409);
      }
    }

    return prisma.course.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase().trim() }),
        ...(data.title && { title: data.title.trim() }),
        ...(data.creditUnit !== undefined && { creditUnit: data.creditUnit }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.level !== undefined && { level: data.level }),
      },
      include: { department: true },
    });
  }
}
