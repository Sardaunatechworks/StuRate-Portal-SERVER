import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { hashPassword } from '../utils/auth';

export class LecturerService {
  static async getAll(filters?: { departmentId?: string; search?: string }) {
    const where: any = {};
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.search) {
      where.OR = [
        { staffId: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return prisma.lecturer.findMany({
      where,
      orderBy: { user: { name: 'asc' } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: true,
        assignments: {
          include: {
            course: true,
          },
        },
        _count: {
          select: {
            evaluations: true,
          },
        },
      },
    });
  }

  static async getById(id: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: true,
        assignments: {
          include: { course: true },
        },
      },
    });
    if (!lecturer) throw new AppError('Lecturer not found.', 404);
    return lecturer;
  }

  static async create(data: {
    name: string;
    email: string;
    staffId: string;
    departmentId: string;
    password: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new AppError(`User with email "${data.email}" already exists.`, 409);
    }

    const existingStaff = await prisma.lecturer.findUnique({
      where: { staffId: data.staffId.trim() },
    });
    if (existingStaff) {
      throw new AppError(`Staff ID "${data.staffId}" is already registered.`, 409);
    }

    const passwordHash = await hashPassword(data.password);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: Role.LECTURER,
          isActive: true,
        },
      });

      const lecturer = await tx.lecturer.create({
        data: {
          userId: user.id,
          staffId: data.staffId.trim(),
          departmentId: data.departmentId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, isActive: true },
          },
          department: true,
        },
      });

      return lecturer;
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      staffId?: string;
      departmentId?: string;
      password?: string;
      isActive?: boolean;
    }
  ) {
    const lecturer = await this.getById(id);

    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });
      if (existingUser && existingUser.id !== lecturer.userId) {
        throw new AppError(`Email "${data.email}" is already used by another account.`, 409);
      }
    }

    if (data.staffId) {
      const existingStaff = await prisma.lecturer.findUnique({
        where: { staffId: data.staffId.trim() },
      });
      if (existingStaff && existingStaff.id !== id) {
        throw new AppError(`Staff ID "${data.staffId}" is already assigned to another lecturer.`, 409);
      }
    }

    return prisma.$transaction(async (tx) => {
      let passwordHash: string | undefined;
      if (data.password && data.password.trim().length >= 6) {
        passwordHash = await hashPassword(data.password);
      }

      await tx.user.update({
        where: { id: lecturer.userId },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.email && { email: data.email.toLowerCase().trim() }),
          ...(passwordHash && { passwordHash }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      const updated = await tx.lecturer.update({
        where: { id },
        data: {
          ...(data.staffId && { staffId: data.staffId.trim() }),
          ...(data.departmentId && { departmentId: data.departmentId }),
        },
        include: {
          user: { select: { id: true, name: true, email: true, isActive: true } },
          department: true,
        },
      });

      return updated;
    });
  }
}
