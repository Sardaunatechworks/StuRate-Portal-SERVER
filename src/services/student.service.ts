import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { hashPassword } from '../utils/auth';

export class StudentService {
  static async getAll(filters?: { departmentId?: string; level?: number; search?: string }) {
    const where: any = {};
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.level) where.level = filters.level;
    if (filters?.search) {
      where.OR = [
        { matricNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return prisma.student.findMany({
      where,
      orderBy: { matricNumber: 'asc' },
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
        _count: {
          select: {
            evaluations: true,
          },
        },
      },
    });
  }

  static async getById(id: string) {
    const student = await prisma.student.findUnique({
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
        evaluations: {
          include: {
            course: true,
            evaluationPeriod: true,
          },
        },
      },
    });
    if (!student) throw new AppError('Student not found.', 404);
    return student;
  }

  static async create(data: {
    name: string;
    email: string;
    matricNumber: string;
    departmentId: string;
    level: number;
    password: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new AppError(`User with email "${data.email}" already exists.`, 409);
    }

    const existingMatric = await prisma.student.findUnique({
      where: { matricNumber: data.matricNumber.trim() },
    });
    if (existingMatric) {
      throw new AppError(`Matriculation Number "${data.matricNumber}" is already registered.`, 409);
    }

    const passwordHash = await hashPassword(data.password);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          matricNumber: data.matricNumber.trim(),
          departmentId: data.departmentId,
          level: data.level,
        },
        include: {
          user: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
          department: true,
        },
      });

      return student;
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      matricNumber?: string;
      departmentId?: string;
      level?: number;
      password?: string;
      isActive?: boolean;
    }
  ) {
    const student = await this.getById(id);

    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });
      if (existingUser && existingUser.id !== student.userId) {
        throw new AppError(`Email "${data.email}" is already used by another account.`, 409);
      }
    }

    if (data.matricNumber) {
      const existingMatric = await prisma.student.findUnique({
        where: { matricNumber: data.matricNumber.trim() },
      });
      if (existingMatric && existingMatric.id !== id) {
        throw new AppError(
          `Matriculation Number "${data.matricNumber}" is already in use.`,
          409
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      let passwordHash: string | undefined;
      if (data.password && data.password.trim().length >= 6) {
        passwordHash = await hashPassword(data.password);
      }

      await tx.user.update({
        where: { id: student.userId },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.email && { email: data.email.toLowerCase().trim() }),
          ...(passwordHash && { passwordHash }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      const updated = await tx.student.update({
        where: { id },
        data: {
          ...(data.matricNumber && { matricNumber: data.matricNumber.trim() }),
          ...(data.departmentId && { departmentId: data.departmentId }),
          ...(data.level !== undefined && { level: data.level }),
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
