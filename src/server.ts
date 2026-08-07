import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
  } catch (err) {
    console.warn('Database initialization notice:', err);
  }
};

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});
