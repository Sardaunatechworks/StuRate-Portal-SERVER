import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error Details]:', err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Handle Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      const field = target.length > 0 ? target.join(', ') : 'field';
      return sendError(
        res,
        `A record with this ${field} already exists. Duplicate values are not allowed.`,
        409
      );
    }

    if (err.code === 'P2025') {
      return sendError(res, 'The requested academic record was not found.', 404);
    }

    if (err.code === 'P2003') {
      return sendError(
        res,
        'Cannot complete this operation because referenced related records exist.',
        400
      );
    }
  }

  // Fallback safe error
  const message =
    process.env.NODE_ENV === 'development' && err.message
      ? err.message
      : 'An unexpected server error occurred. Please try again.';

  return sendError(res, message, 500);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
};
