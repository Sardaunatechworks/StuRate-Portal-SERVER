import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SRTES Database Seeding: Production Clean Seed ---');

  // 1. Clean existing records in strict reverse dependency order
  console.log('Cleaning existing mock and transactional records...');
  await prisma.evaluationResponse.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.courseAssignment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.department.deleteMany();
  await prisma.evaluationQuestion.deleteMany();
  await prisma.evaluationPeriod.deleteMany();
  await prisma.user.deleteMany();
  console.log('All mock data purged.');

  // 2. Seed ONLY SuperAdministrator
  const adminPasswordHash = await bcrypt.hash('Password123!', 10);
  const superadmin = await prisma.user.create({
    data: {
      name: 'System SuperAdmin',
      email: 'superadmin@fud.edu.ng',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`Seeded SuperAdmin: ${superadmin.email} (Password: Password123!)`);

  // 3. Seed ONLY Approved Evaluation Criteria Questions
  const criteriaQuestions = [
    {
      order: 1,
      category: 'Subject Knowledge',
      questionText: 'Demonstrates in-depth subject knowledge and mastery of course concepts.',
    },
    {
      order: 2,
      category: 'Teaching Method',
      questionText: 'Employs effective teaching methods that stimulate critical thinking and student understanding.',
    },
    {
      order: 3,
      category: 'Communication Skills',
      questionText: 'Communicates clearly, effectively, and encourages meaningful classroom interaction.',
    },
    {
      order: 4,
      category: 'Punctuality',
      questionText: 'Maintains punctuality and regularity for scheduled lectures and practical sessions.',
    },
    {
      order: 5,
      category: 'Course Organization',
      questionText: 'Presents well-structured course content, syllabus coverage, and learning objectives.',
    },
    {
      order: 6,
      category: 'Student Engagement',
      questionText: 'Engages students actively and welcomes constructive questions, contributions, and discussions.',
    },
    {
      order: 7,
      category: 'Fairness in Assessment',
      questionText: 'Evaluates assignments, tests, and examinations with fairness, objectivity, and transparency.',
    },
    {
      order: 8,
      category: 'Availability to Students',
      questionText: 'Is approachable, supportive, and accessible to assist students during consultation hours.',
    },
    {
      order: 9,
      category: 'Overall Satisfaction',
      questionText: 'Overall rating of the lecturer’s effectiveness, commitment, and contribution to student learning.',
    },
  ];

  for (const item of criteriaQuestions) {
    await prisma.evaluationQuestion.create({
      data: {
        order: item.order,
        category: item.category,
        questionText: item.questionText,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${criteriaQuestions.length} official evaluation criteria questions.`);
  console.log('--- Seeding finished: Only Admin & Criteria Questions remain. ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
