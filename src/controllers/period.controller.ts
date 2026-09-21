import { Request, Response, NextFunction } from 'express';
import { PeriodService } from '../services/period.service';
import { sendSuccess } from '../utils/response';

export class PeriodController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const periods = await PeriodService.getAll();
      return sendSuccess(res, periods);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await PeriodService.getById(req.params.id);
      return sendSuccess(res, period);
    } catch (error) {
      next(error);
    }
  }

  static async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const active = await PeriodService.getActive();
      return sendSuccess(res, active);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await PeriodService.create(req.body);
      return sendSuccess(res, period, 'Evaluation period created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await PeriodService.update(req.params.id, req.body);
      return sendSuccess(res, period, 'Evaluation period updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await PeriodService.setStatus(req.params.id, req.body.status);
      return sendSuccess(res, period, `Evaluation period status updated to ${req.body.status}.`);
    } catch (error) {
      next(error);
    }
  }
}
