import { PeriodStatus, Semester } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class PeriodService {
  static async getAll() {
    return prisma.evaluationPeriod.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { evaluations: true },
        },
      },
    });
  }

  static async getById(id: string) {
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: { evaluations: true },
        },
      },
    });
    if (!period) throw new AppError('Evaluation period not found.', 404);
    return period;
  }

  static async getActive() {
    return prisma.evaluationPeriod.findFirst({
      where: { status: PeriodStatus.OPEN },
    });
  }

  static async create(data: {
    title: string;
    academicSession: string;
    semester: Semester;
    startDate: string;
    endDate: string;
    status?: PeriodStatus;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start >= end) {
      throw new AppError('Evaluation start date must be before end date.', 400);
    }

    // If marked OPEN, close all others
    if (data.status === PeriodStatus.OPEN) {
      await prisma.evaluationPeriod.updateMany({
        where: { status: PeriodStatus.OPEN },
        data: { status: PeriodStatus.CLOSED },
      });
    }

    return prisma.evaluationPeriod.create({
      data: {
        title: data.title.trim(),
        academicSession: data.academicSession,
        semester: data.semester,
        startDate: start,
        endDate: end,
        status: data.status || PeriodStatus.DRAFT,
      },
    });
  }

  static async update(
    id: string,
    data: Partial<{
      title: string;
      academicSession: string;
      semester: Semester;
      startDate: string;
      endDate: string;
      status: PeriodStatus;
    }>
  ) {
    const period = await this.getById(id);

    if (period.status === PeriodStatus.CLOSED && data.status !== PeriodStatus.OPEN) {
      // Check if trying to edit closed period
    }

    if (data.status === PeriodStatus.OPEN) {
      await prisma.evaluationPeriod.updateMany({
        where: { id: { not: id }, status: PeriodStatus.OPEN },
        data: { status: PeriodStatus.CLOSED },
      });
    }

    return prisma.evaluationPeriod.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.academicSession && { academicSession: data.academicSession }),
        ...(data.semester && { semester: data.semester }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  static async setStatus(id: string, status: PeriodStatus) {
    return this.update(id, { status });
  }
}
