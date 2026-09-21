import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service';
import { sendSuccess } from '../utils/response';

export class CourseController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, level, search } = req.query;
      const courses = await CourseService.getAll({
        departmentId: departmentId ? String(departmentId) : undefined,
        level: level ? parseInt(String(level), 10) : undefined,
        search: search ? String(search) : undefined,
      });
      return sendSuccess(res, courses);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await CourseService.getById(req.params.id);
      return sendSuccess(res, course);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await CourseService.create(req.body);
      return sendSuccess(res, course, 'Course created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await CourseService.update(req.params.id, req.body);
      return sendSuccess(res, course, 'Course updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
