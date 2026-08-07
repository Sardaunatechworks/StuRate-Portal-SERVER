import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';
import lecturerRoutes from './routes/lecturer.routes';
import reportRoutes from './routes/report.routes';
import { prisma } from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api', reportRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: "Student Rating Teachers' Effectiveness System API",
    timestamp: new Date().toISOString()
  });
});

const initDatabase = async () => {
  try {
    // 1. Verify if database tables exist, otherwise auto-run prisma db push
    try {
      await prisma.user.count();
    } catch (dbError) {
      console.log('Database tables missing. Automatically initializing schema via prisma db push...');
      const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: dbUrl }
      });
    }

    // 2. Auto-seed default department data if empty
    const deptCount = await prisma.department.count().catch(() => 0);
    if (deptCount === 0) {
      console.log('Database empty. Auto-seeding initial department data...');
      const defaultDepts = [
        { code: 'CSC', name: 'Computer Science', description: 'Department of Computer Science' },
        { code: 'EEE', name: 'Electrical & Electronic Engineering', description: 'Department of Electrical & Electronic Engineering' },
        { code: 'IT', name: 'Information Technology', description: 'Department of Information Technology' },
        { code: 'CYS', name: 'Cyber Security', description: 'Department of Cyber Security' }
      ];
      for (const dept of defaultDepts) {
        await prisma.department.create({ data: dept }).catch(() => {});
      }
    }

    // 3. Auto-seed Super Admin account if no ADMIN user exists
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } }).catch(() => 0);
    if (adminCount === 0) {
      console.log('No Admin user found. Creating initial Super Admin account...');
      const adminPasswordHash = await bcrypt.hash('Password123!', 10);
      await prisma.user.create({
        data: {
          email: 'superadmin@fud.edu.ng',
          passwordHash: adminPasswordHash,
          name: 'System Administrator',
          role: 'ADMIN',
        }
      }).catch(() => {});
      console.log('Super Admin account created: superadmin@fud.edu.ng');
    }

    // 4. Auto-seed 9 Standard Evaluation Criteria Questions if empty
    const questionCount = await prisma.evaluationQuestion.count().catch(() => 0);
    if (questionCount === 0) {
      console.log('No Evaluation Questions found. Auto-seeding 9 standard criteria questions...');
      const questionsData = [
        { questionText: 'Subject Knowledge: Displays deep understanding of the course topic.', category: 'Pedagogy', order: 1 },
        { questionText: 'Teaching Method: Uses effective and engaging instructional techniques.', category: 'Pedagogy', order: 2 },
        { questionText: 'Communication Skills: Explains complex concepts clearly and articulately.', category: 'Communication', order: 3 },
        { questionText: 'Punctuality: Arrives on time for scheduled lectures and labs.', category: 'Professionalism', order: 4 },
        { questionText: 'Course Organization: Delivers syllabus content in a structured manner.', category: 'Organization', order: 5 },
        { questionText: 'Student Engagement: Encourages active classroom participation and questions.', category: 'Engagement', order: 6 },
        { questionText: 'Fairness in Assessment: Evaluates tests and assignments objectively.', category: 'Assessment', order: 7 },
        { questionText: 'Availability to Students: Accessible during office hours for consultation.', category: 'Support', order: 8 },
        { questionText: 'Overall Satisfaction: Satisfied with the teacher\'s overall effectiveness.', category: 'General', order: 9 },
      ];
      for (const q of questionsData) {
        await prisma.evaluationQuestion.create({ data: q }).catch(() => {});
      }
      console.log('Evaluation questions seeded successfully!');
    }

    // 5. Auto-seed Evaluation Period if empty
    const periodCount = await prisma.evaluationPeriod.count().catch(() => 0);
    if (periodCount === 0) {
      console.log('No Evaluation Period found. Auto-creating active evaluation period...');
      await prisma.evaluationPeriod.create({
        data: {
          title: '2025/2026 First Semester Evaluation Period',
          academicSession: '2025/2026',
          semester: 'FIRST',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          isActive: true,
        }
      }).catch(() => {});
      console.log('Active evaluation period created successfully!');
    }

  } catch (err) {
    console.warn('Database initialization notice:', err);
  }
};

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});
