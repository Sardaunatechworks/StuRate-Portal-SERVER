import { Request, Response, NextFunction } from 'express';
import { LecturerService } from '../services/lecturer.service';
import { sendSuccess } from '../utils/response';

export class LecturerController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, search } = req.query;
      const lecturers = await LecturerService.getAll({
        departmentId: departmentId ? String(departmentId) : undefined,
        search: search ? String(search) : undefined,
      });
      return sendSuccess(res, lecturers);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const lecturer = await LecturerService.getById(req.params.id);
      return sendSuccess(res, lecturer);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const lecturer = await LecturerService.create(req.body);
      return sendSuccess(res, lecturer, 'Lecturer created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const lecturer = await LecturerService.update(req.params.id, req.body);
      return sendSuccess(res, lecturer, 'Lecturer updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
