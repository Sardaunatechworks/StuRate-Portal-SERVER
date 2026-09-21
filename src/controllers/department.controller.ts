import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';
import { sendSuccess } from '../utils/response';

export class DepartmentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await DepartmentService.getAll();
      return sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await DepartmentService.getById(req.params.id);
      return sendSuccess(res, department);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await DepartmentService.create(req.body);
      return sendSuccess(res, department, 'Department created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await DepartmentService.update(req.params.id, req.body);
      return sendSuccess(res, department, 'Department updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
