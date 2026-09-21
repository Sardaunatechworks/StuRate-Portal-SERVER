import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { sendSuccess } from '../utils/response';

export class StudentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, level, search } = req.query;
      const students = await StudentService.getAll({
        departmentId: departmentId ? String(departmentId) : undefined,
        level: level ? parseInt(String(level), 10) : undefined,
        search: search ? String(search) : undefined,
      });
      return sendSuccess(res, students);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.getById(req.params.id);
      return sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.create(req.body);
      return sendSuccess(res, student, 'Student created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.update(req.params.id, req.body);
      return sendSuccess(res, student, 'Student updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
