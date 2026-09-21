import { Request, Response, NextFunction } from 'express';
import { QuestionService } from '../services/question.service';
import { sendSuccess } from '../utils/response';

export class QuestionController {
  static async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const questions = await QuestionService.getActiveQuestions();
      return sendSuccess(res, questions);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const questions = await QuestionService.getAll();
      return sendSuccess(res, questions);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await QuestionService.getById(req.params.id);
      return sendSuccess(res, question);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await QuestionService.create(req.body);
      return sendSuccess(res, question, 'Evaluation question created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await QuestionService.update(req.params.id, req.body);
      return sendSuccess(res, question, 'Evaluation question updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
