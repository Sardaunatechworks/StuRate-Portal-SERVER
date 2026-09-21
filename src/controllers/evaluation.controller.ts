import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { EvaluationService } from '../services/evaluation.service';
import { sendSuccess } from '../utils/response';

export class EvaluationController {
  static async getStudentDashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await EvaluationService.getStudentDashboard(req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getEligibleEvaluations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await EvaluationService.getEligibleEvaluations(req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getEvaluationFormDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await EvaluationService.getEvaluationFormDetails(
        req.user!.userId,
        req.params.assignmentId
      );
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async submitEvaluation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await EvaluationService.submitEvaluation(
        req.user!.userId,
        req.body
      );
      return sendSuccess(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const history = await EvaluationService.getStudentHistory(req.user!.userId);
      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }
}
