import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class QuestionService {
  static async getActiveQuestions() {
    return prisma.evaluationQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  static async getAll() {
    return prisma.evaluationQuestion.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  static async getById(id: string) {
    const q = await prisma.evaluationQuestion.findUnique({
      where: { id },
    });
    if (!q) throw new AppError('Question not found.', 404);
    return q;
  }

  static async create(data: {
    category: string;
    questionText: string;
    order: number;
    isActive?: boolean;
  }) {
    return prisma.evaluationQuestion.create({
      data: {
        category: data.category.trim(),
        questionText: data.questionText.trim(),
        order: data.order,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  static async update(
    id: string,
    data: Partial<{
      category: string;
      questionText: string;
      order: number;
      isActive: boolean;
    }>
  ) {
    await this.getById(id);

    return prisma.evaluationQuestion.update({
      where: { id },
      data: {
        ...(data.category && { category: data.category.trim() }),
        ...(data.questionText && { questionText: data.questionText.trim() }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }
}
