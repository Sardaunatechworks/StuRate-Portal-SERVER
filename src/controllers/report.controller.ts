import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ReportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';

export class ReportController {
  // Lecturer Endpoints
  static async getLecturerDashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await ReportService.getLecturerDashboard(req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getLecturerAnalytics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await ReportService.getLecturerAnalytics(req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getLecturerComments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await ReportService.getLecturerComments(req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  // Admin Endpoints
  static async getAdminDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await ReportService.getAdminDashboard();
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminReports(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { departmentId, courseId, lecturerId, evaluationPeriodId } = req.query;
      const data = await ReportService.getAdminReports({
        departmentId: departmentId ? String(departmentId) : undefined,
        courseId: courseId ? String(courseId) : undefined,
        lecturerId: lecturerId ? String(lecturerId) : undefined,
        evaluationPeriodId: evaluationPeriodId ? String(evaluationPeriodId) : undefined,
      });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
