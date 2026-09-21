import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  lecturerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}
