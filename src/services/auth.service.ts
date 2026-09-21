import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import { StudentService } from './student.service';

export class AuthService {
  static async signupStudent(data: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    matricNumber?: string;
    departmentId: string;
    level: number;
  }) {
    const matric = (data.matricNumber || data.studentId || '').trim();
    if (!data.name || !data.email || !data.password || !matric) {
      throw new AppError('Full name, email, student ID / matriculation number, and password are required.', 400);
    }

    if (data.password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    // Resolve departmentId to a valid department if given fallback or non-existent ID
    let validDepartmentId = data.departmentId;
    let dept = validDepartmentId ? await prisma.department.findUnique({ where: { id: validDepartmentId } }) : null;
    if (!dept) {
      // Fallback: search by code or first available department
      dept = await prisma.department.findFirst({
        where: { code: 'CSC' }
      }) || await prisma.department.findFirst();

      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: 'Computer Science',
            code: 'CSC',
          },
        });
      }
      validDepartmentId = dept.id;
    }

    const student = await StudentService.create({
      name: data.name,
      email: data.email,
      matricNumber: matric,
      departmentId: validDepartmentId,
      level: Number(data.level) || 100,
      password: data.password,
    });

    const tokenPayload = {
      id: student.user.id,
      userId: student.user.id,
      name: student.user.name,
      email: student.user.email,
      role: Role.STUDENT,
      studentId: student.id,
      lecturerId: undefined,
    };

    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        id: student.user.id,
        name: student.user.name,
        email: student.user.email,
        role: Role.STUDENT,
        student: {
          id: student.id,
          matricNumber: student.matricNumber,
          departmentId: student.departmentId,
          level: student.level,
          department: student.department,
        },
        createdAt: (student.user as any)?.createdAt || new Date(),
      },
    };
  }
  static async login(identifier: string, password: string) {
    const cleanId = identifier.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: 'insensitive' } },
          { student: { matricNumber: { equals: cleanId, mode: 'insensitive' } } },
          { lecturer: { staffId: { equals: cleanId, mode: 'insensitive' } } },
        ],
      },
      include: {
        student: {
          include: { department: true },
        },
        lecturer: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email address, ID, or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('This account has been deactivated. Please contact the administrator.', 403);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email address or password.', 401);
    }

    const tokenPayload = {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.student?.id,
      lecturerId: user.lecturer?.id,
    };

    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student: user.student,
        lecturer: user.lecturer,
        createdAt: user.createdAt,
      },
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: { department: true },
        },
        lecturer: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student: user.student,
      lecturer: user.lecturer,
      createdAt: user.createdAt,
    };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400);
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully.' };
  }

  static async updateProfile(userId: string, name: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      include: {
        student: { include: { department: true } },
        lecturer: { include: { department: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      student: updated.student,
      lecturer: updated.lecturer,
    };
  }
}
