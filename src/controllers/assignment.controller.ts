import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { sendSuccess } from '../utils/response';
import { Semester } from '@prisma/client';

export class AssignmentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { lecturerId, courseId, academicSession, semester, departmentId } = req.query;
      const assignments = await AssignmentService.getAll({
        lecturerId: lecturerId ? String(lecturerId) : undefined,
        courseId: courseId ? String(courseId) : undefined,
        academicSession: academicSession ? String(academicSession) : undefined,
        semester: semester ? (semester as Semester) : undefined,
        departmentId: departmentId ? String(departmentId) : undefined,
      });
      return sendSuccess(res, assignments);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = await AssignmentService.getById(req.params.id);
      return sendSuccess(res, assignment);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = await AssignmentService.create(req.body);
      return sendSuccess(res, assignment, 'Course assigned to lecturer successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AssignmentService.delete(req.params.id);
      return sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}
