import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class DepartmentService {
  static async getAll() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            students: true,
            courses: true,
            lecturers: true,
          },
        },
      },
    });
  }

  static async getById(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        students: { include: { user: true } },
        courses: true,
        lecturers: { include: { user: true } },
      },
    });
    if (!dept) throw new AppError('Department not found.', 404);
    return dept;
  }

  static async create(data: { name: string; code: string }) {
    const existing = await prisma.department.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) {
      throw new AppError(`Department with code "${data.code}" already exists.`, 409);
    }

    return prisma.department.create({
      data: {
        name: data.name.trim(),
        code: data.code.toUpperCase().trim(),
      },
    });
  }

  static async update(id: string, data: { name?: string; code?: string }) {
    await this.getById(id);
    if (data.code) {
      const existing = await prisma.department.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new AppError(`Department code "${data.code}" is already in use.`, 409);
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.code && { code: data.code.toUpperCase().trim() }),
      },
    });
  }
}
