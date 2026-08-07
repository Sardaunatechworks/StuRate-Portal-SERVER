import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, identifier, password } = req.body;
    const loginInput = (identifier || email || '').trim();

    if (!loginInput || !password) {
      return res.status(400).json({ message: 'Email / Registration Number and password are required.' });
    }

    // 1. Attempt lookup by User email
    let user = await prisma.user.findUnique({
      where: { email: loginInput },
      include: {
        student: true,
        lecturer: true,
      },
    });

    // 2. If not found by email, lookup by Student registration number (studentId)
    if (!user) {
      const studentRecord = await prisma.student.findUnique({
        where: { studentId: loginInput },
        include: { user: true }
      });
      if (studentRecord) {
        user = await prisma.user.findUnique({
          where: { id: studentRecord.userId },
          include: { student: true, lecturer: true }
        });
      }
    }

    // 3. If not found by studentId, lookup by Lecturer staff ID
    if (!user) {
      const lecturerRecord = await prisma.lecturer.findUnique({
        where: { staffId: loginInput },
        include: { user: true }
      });
      if (lecturerRecord) {
        user = await prisma.user.findUnique({
          where: { id: lecturerRecord.userId },
          include: { student: true, lecturer: true }
        });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User record not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const secret = process.env.JWT_SECRET || 'super-secret-student-rating-jwt-key-2026';
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student?.id,
      lecturerId: user.lecturer?.id,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: payload,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during authentication', error: error.message });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
};

export const getMe = async (req: any, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        student: {
          include: { department: true }
        },
        lecturer: {
          include: { department: true }
        }
      }
    });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
};

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const registerStudent = async (req: Request, res: Response) => {
  try {
    const { name, email, password, studentId, departmentId, level } = req.body;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedStudentId = (studentId || '').trim();
    const trimmedDepartmentId = (departmentId || '').trim();

    if (!trimmedName || !trimmedEmail || !password || !trimmedStudentId) {
      return res.status(400).json({
        message: 'Name, email, password, and registration number are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    // Check if studentId / registration number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: trimmedStudentId }
    });
    if (existingStudent) {
      return res.status(400).json({ message: 'A student with this registration number already exists.' });
    }

    // Safe department lookup avoiding Prisma UUID format exceptions
    let departmentExists = null;
    if (trimmedDepartmentId && UUID_REGEX.test(trimmedDepartmentId)) {
      departmentExists = await prisma.department.findUnique({
        where: { id: trimmedDepartmentId }
      });
    }

    if (!departmentExists && trimmedDepartmentId) {
      const codeCandidate = trimmedDepartmentId.split('-')[0].toUpperCase();
      departmentExists = await prisma.department.findFirst({
        where: {
          OR: [
            { code: codeCandidate },
            { name: { contains: codeCandidate } }
          ]
        }
      });
    }

    if (!departmentExists) {
      departmentExists = await prisma.department.findFirst();
    }

    if (!departmentExists) {
      // Auto-seed default department if database has no departments yet
      departmentExists = await prisma.department.create({
        data: {
          code: 'CSC',
          name: 'Computer Science',
          description: 'Department of Computer Science'
        }
      });
    }

    const targetDepartmentId = departmentExists.id;

    const passwordHash = await bcrypt.hash(password, 10);
    const parsedLevel = Number(level) || 100;

    let user;
    let studentRecord;
    try {
      const res = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: trimmedName,
            email: trimmedEmail,
            passwordHash,
            role: 'STUDENT'
          }
        });

        const newStudent = await tx.student.create({
          data: {
            userId: newUser.id,
            studentId: trimmedStudentId,
            departmentId: targetDepartmentId,
            level: parsedLevel
          }
        });

        return { user: newUser, studentRecord: newStudent };
      });
      user = res.user;
      studentRecord = res.studentRecord;
    } catch (txErr) {
      console.warn('Transaction fallback triggered for student creation:', txErr);
      user = await prisma.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          passwordHash,
          role: 'STUDENT'
        }
      });
      studentRecord = await prisma.student.create({
        data: {
          userId: user.id,
          studentId: trimmedStudentId,
          departmentId: targetDepartmentId,
          level: parsedLevel
        }
      });
    }


    const secret = process.env.JWT_SECRET || 'super-secret-student-rating-jwt-key-2026';
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: studentRecord.id,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    res.status(201).json({
      message: 'Student account created successfully.',
      token,
      user: payload
    });
  } catch (error: any) {
    console.error('Error during student registration:', error);
    res.status(500).json({ message: 'Failed to create student account', error: error.message });
  }
};


export const getPublicDepartments = async (_req: Request, res: Response) => {
  try {
    let departments = await prisma.department.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: 'asc' }
    });

    if (!departments || departments.length === 0) {
      // Seed default departments if table is empty
      for (const d of [
        { code: 'CSC', name: 'Computer Science', description: 'Department of Computer Science' },
        { code: 'EEE', name: 'Electrical & Electronic Engineering', description: 'Department of Electrical & Electronic Engineering' },
        { code: 'IT', name: 'Information Technology', description: 'Department of Information Technology' },
        { code: 'CYS', name: 'Cyber Security', description: 'Department of Cyber Security' }
      ]) {
        await prisma.department.create({ data: d }).catch(() => {});
      }

      departments = await prisma.department.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { name: 'asc' }
      });
    }

    res.json(departments);

  } catch (error: any) {
    // Graceful fallback to prevent client failure if database connection is initializing
    res.json([
      { id: 'csc-fallback', code: 'CSC', name: 'Computer Science' },
      { id: 'eee-fallback', code: 'EEE', name: 'Electrical & Electronic Engineering' },
      { id: 'it-fallback', code: 'IT', name: 'Information Technology' },
      { id: 'cys-fallback', code: 'CYS', name: 'Cyber Security' }
    ]);
  }
};


