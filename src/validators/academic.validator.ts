import { z } from 'zod';
import { Semester } from '@prisma/client';

export const departmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name is required'),
    code: z.string().min(2, 'Department code is required').toUpperCase(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).toUpperCase().optional(),
  }),
});

export const courseSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Course code is required').toUpperCase(),
    title: z.string().min(3, 'Course title is required'),
    creditUnit: z.number().int().min(1).max(6),
    departmentId: z.string().uuid('Valid department ID is required'),
    level: z.number().int().min(100).max(500),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    code: z.string().min(2).toUpperCase().optional(),
    title: z.string().min(3).optional(),
    creditUnit: z.number().int().min(1).max(6).optional(),
    departmentId: z.string().uuid().optional(),
    level: z.number().int().min(100).max(500).optional(),
  }),
});

export const lecturerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email is required'),
    staffId: z.string().min(3, 'Staff ID is required'),
    departmentId: z.string().uuid('Department is required'),
    password: z.string().min(6, 'Initial password must be at least 6 characters'),
  }),
});

export const updateLecturerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    staffId: z.string().min(3).optional(),
    departmentId: z.string().uuid().optional(),
    password: z.string().min(6).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const studentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email is required'),
    matricNumber: z.string().min(3, 'Matriculation number is required'),
    departmentId: z.string().uuid('Department is required'),
    level: z.number().int().min(100).max(500),
    password: z.string().min(6, 'Initial password must be at least 6 characters'),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    matricNumber: z.string().min(3).optional(),
    departmentId: z.string().uuid().optional(),
    level: z.number().int().min(100).max(500).optional(),
    password: z.string().min(6).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const courseAssignmentSchema = z.object({
  body: z.object({
    lecturerId: z.string().uuid('Lecturer ID is required'),
    courseId: z.string().uuid('Course ID is required'),
    academicSession: z.string().regex(/^\d{4}\/\d{4}$/, 'Session must be in format YYYY/YYYY (e.g. 2025/2026)'),
    semester: z.nativeEnum(Semester),
  }),
});
