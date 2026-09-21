import { z } from 'zod';
import { Semester, PeriodStatus } from '@prisma/client';

export const evaluationPeriodSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    academicSession: z.string().regex(/^\d{4}\/\d{4}$/, 'Session must be in format YYYY/YYYY (e.g. 2025/2026)'),
    semester: z.nativeEnum(Semester),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    status: z.nativeEnum(PeriodStatus).optional(),
  }),
});

export const updateEvaluationPeriodStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PeriodStatus),
  }),
});

export const evaluationQuestionSchema = z.object({
  body: z.object({
    category: z.string().min(2, 'Category is required'),
    questionText: z.string().min(5, 'Question text is required'),
    order: z.number().int().min(1),
    isActive: z.boolean().optional(),
  }),
});

export const submitEvaluationSchema = z.object({
  body: z.object({
    courseAssignmentId: z.string().uuid('Course Assignment ID is required'),
    comment: z.string().max(1000).optional(),
    ratings: z
      .array(
        z.object({
          questionId: z.string().uuid('Question ID is required'),
          rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
        })
      )
      .min(1, 'At least one evaluation response is required'),
  }),
});
