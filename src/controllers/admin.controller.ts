import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';

// --- DEPARTMENTS ---
export const getDepartments = async (_req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { students: true, lecturers: true, courses: true }
        }
      },
      orderBy: { code: 'asc' }
    });
    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description } = req.body;
    const department = await prisma.department.create({
      data: { code, name, description }
    });
    res.status(201).json(department);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating department', error: error.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body;
    const department = await prisma.department.update({
      where: { id },
      data: { code, name, description }
    });
    res.json(department);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating department', error: error.message });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting department', error: error.message });
  }
};

// --- COURSES ---
export const getCourses = async (_req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: { department: true },
      orderBy: { code: 'asc' }
    });
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { code, title, creditUnit, departmentId } = req.body;
    const course = await prisma.course.create({
      data: { code, title, creditUnit: Number(creditUnit), departmentId },
      include: { department: true }
    });
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating course', error: error.message });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, title, creditUnit, departmentId } = req.body;
    const course = await prisma.course.update({
      where: { id },
      data: { code, title, creditUnit: Number(creditUnit), departmentId },
      include: { department: true }
    });
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating course', error: error.message });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting course', error: error.message });
  }
};

// --- STUDENTS ---
export const getStudents = async (_req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
      },
      orderBy: { studentId: 'asc' }
    });
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, studentId, departmentId, level } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });

    const passwordHash = await bcrypt.hash(password || 'Student123!', 10);

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'STUDENT'
        }
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId,
          departmentId,
          level: Number(level) || 100
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          department: true
        }
      });
      return student;
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating student', error: error.message });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, studentId, departmentId, level } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: student.userId },
        data: { name, email }
      }),
      prisma.student.update({
        where: { id },
        data: { studentId, departmentId, level: Number(level) }
      })
    ]);

    const updated = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating student', error: error.message });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (student) {
      await prisma.user.delete({ where: { id: student.userId } });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting student', error: error.message });
  }
};

// --- LECTURERS ---
export const getLecturers = async (_req: AuthRequest, res: Response) => {
  try {
    const lecturers = await prisma.lecturer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true,
        courseAssignments: {
          include: { course: true }
        }
      },
      orderBy: { staffId: 'asc' }
    });
    res.json(lecturers);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching lecturers', error: error.message });
  }
};

export const createLecturer = async (req: AuthRequest, res: Response) => {
  try {
    const { title, name, email, password, staffId, departmentId } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });

    const passwordHash = await bcrypt.hash(password || 'Lecturer123!', 10);

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'LECTURER'
        }
      });

      const lecturer = await tx.lecturer.create({
        data: {
          userId: user.id,
          staffId,
          title: title || 'Dr.',
          departmentId
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          department: true
        }
      });
      return lecturer;
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating lecturer', error: error.message });
  }
};

export const updateLecturer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, name, email, staffId, departmentId } = req.body;

    const lecturer = await prisma.lecturer.findUnique({ where: { id } });
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: lecturer.userId },
        data: { name, email }
      }),
      prisma.lecturer.update({
        where: { id },
        data: { title, staffId, departmentId }
      })
    ]);

    const updated = await prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: true
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating lecturer', error: error.message });
  }
};

export const deleteLecturer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lecturer = await prisma.lecturer.findUnique({ where: { id } });
    if (lecturer) {
      await prisma.user.delete({ where: { id: lecturer.userId } });
    }
    res.json({ message: 'Lecturer deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting lecturer', error: error.message });
  }
};

// --- COURSE ASSIGNMENTS ---
export const getAssignments = async (_req: AuthRequest, res: Response) => {
  try {
    const assignments = await prisma.courseAssignment.findMany({
      include: {
        course: { include: { department: true } },
        lecturer: { include: { user: true, department: true } },
        _count: { select: { enrollments: true, evaluations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, lecturerId, academicSession, semester } = req.body;
    const assignment = await prisma.courseAssignment.create({
      data: {
        courseId,
        lecturerId,
        academicSession: academicSession || '2025/2026',
        semester: semester || 'FIRST'
      },
      include: {
        course: true,
        lecturer: { include: { user: true } }
      }
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ message: 'Error assigning lecturer to course', error: error.message });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.courseAssignment.delete({ where: { id } });
    res.json({ message: 'Course assignment deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting assignment', error: error.message });
  }
};

// --- EVALUATION QUESTIONS ---
export const getQuestions = async (_req: AuthRequest, res: Response) => {
  try {
    const questions = await prisma.evaluationQuestion.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching evaluation questions', error: error.message });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { questionText, category, order, isActive } = req.body;
    const question = await prisma.evaluationQuestion.create({
      data: {
        questionText,
        category: category || 'General',
        order: Number(order) || 1,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json(question);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating question', error: error.message });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questionText, category, order, isActive } = req.body;
    const question = await prisma.evaluationQuestion.update({
      where: { id },
      data: {
        questionText,
        category,
        order: Number(order),
        isActive
      }
    });
    res.json(question);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating question', error: error.message });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.evaluationQuestion.delete({ where: { id } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: 'Error deleting question', error: error.message });
  }
};

// --- EVALUATION PERIODS ---
export const getEvaluationPeriods = async (_req: AuthRequest, res: Response) => {
  try {
    const periods = await prisma.evaluationPeriod.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(periods);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching evaluation periods', error: error.message });
  }
};

export const createEvaluationPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { title, academicSession, semester, startDate, endDate, isActive } = req.body;

    if (isActive) {
      // Deactivate all existing active periods first
      await prisma.evaluationPeriod.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const period = await prisma.evaluationPeriod.create({
      data: {
        title,
        academicSession: academicSession || '2025/2026',
        semester: semester || 'FIRST',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: Boolean(isActive)
      }
    });
    res.status(201).json(period);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creating evaluation period', error: error.message });
  }
};

export const toggleEvaluationPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive) {
      await prisma.evaluationPeriod.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const updated = await prisma.evaluationPeriod.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: 'Error toggling evaluation period status', error: error.message });
  }
};
