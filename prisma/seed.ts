import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Student Rating Teachers\' Effectiveness System Database...');

  // Clean existing tables
  await prisma.evaluationRating.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.studentEnrollment.deleteMany();
  await prisma.courseAssignment.deleteMany();
  await prisma.evaluationQuestion.deleteMany();
  await prisma.evaluationPeriod.deleteMany();
  await prisma.student.deleteMany();
  await prisma.lecturer.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const commonPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Administrator
  const adminUser = await prisma.user.create({
    data: {
      email: 'superadmin@fud.edu.ng',
      passwordHash: commonPasswordHash,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });
  console.log('Created Admin:', adminUser.email);

  // 2. Create Departments
  const deptCSC = await prisma.department.create({
    data: {
      code: 'CSC',
      name: 'Computer Science',
      description: 'Department of Computer Science & Information Technology',
    },
  });

  const deptEEE = await prisma.department.create({
    data: {
      code: 'EEE',
      name: 'Electrical & Electronic Engineering',
      description: 'Department of Electrical & Electronic Engineering',
    },
  });
  console.log('Created Departments: CSC & EEE');

  // 3. Create Lecturers
  const lecturer1User = await prisma.user.create({
    data: {
      email: 'alan.turing@university.edu.ng',
      passwordHash: commonPasswordHash,
      name: 'Alan Turing',
      role: 'LECTURER',
    },
  });
  const lecAlan = await prisma.lecturer.create({
    data: {
      userId: lecturer1User.id,
      staffId: 'FUD/LR/CSC/001',
      title: 'Dr.',
      departmentId: deptCSC.id,
    },
  });

  const lecturer2User = await prisma.user.create({
    data: {
      email: 'ada.lovelace@university.edu.ng',
      passwordHash: commonPasswordHash,
      name: 'Ada Lovelace',
      role: 'LECTURER',
    },
  });
  const lecAda = await prisma.lecturer.create({
    data: {
      userId: lecturer2User.id,
      staffId: 'FUD/LR/CSC/002',
      title: 'Prof.',
      departmentId: deptCSC.id,
    },
  });

  const lecturer3User = await prisma.user.create({
    data: {
      email: 'grace.hopper@university.edu.ng',
      passwordHash: commonPasswordHash,
      name: 'Grace Hopper',
      role: 'LECTURER',
    },
  });
  const lecGrace = await prisma.lecturer.create({
    data: {
      userId: lecturer3User.id,
      staffId: 'FUD/LR/EEE/001',
      title: 'Dr.',
      departmentId: deptEEE.id,
    },
  });
  console.log('Created Lecturers: Dr. Alan Turing, Prof. Ada Lovelace, Dr. Grace Hopper');

  // 4. Create Students
  const student1User = await prisma.user.create({
    data: {
      email: 'john.doe@student.university.edu.ng',
      passwordHash: commonPasswordHash,
      name: 'John Doe',
      role: 'STUDENT',
    },
  });
  const stuJohn = await prisma.student.create({
    data: {
      userId: student1User.id,
      studentId: 'FCP/CSC/23/1001',
      level: 400,
      departmentId: deptCSC.id,
    },
  });

  const student2User = await prisma.user.create({
    data: {
      email: 'jane.smith@student.university.edu.ng',
      passwordHash: commonPasswordHash,
      name: 'Jane Smith',
      role: 'STUDENT',
    },
  });
  const stuJane = await prisma.student.create({
    data: {
      userId: student2User.id,
      studentId: 'FCP/CSC/23/1002',
      level: 400,
      departmentId: deptCSC.id,
    },
  });

  const student3User = await prisma.user.create({
    data: {
      email: 'david.mark@student.university.edu.ng',
      passwordHash: commonPasswordHash,
      name: 'David Mark',
      role: 'STUDENT',
    },
  });
  const stuDavid = await prisma.student.create({
    data: {
      userId: student3User.id,
      studentId: 'FCP/EEE/23/1003',
      level: 300,
      departmentId: deptEEE.id,
    },
  });
  console.log('Created Students: John Doe, Jane Smith, David Mark');

  // 5. Create Courses
  const csc401 = await prisma.course.create({
    data: { code: 'CSC401', title: 'Software Engineering Methodology', creditUnit: 3, departmentId: deptCSC.id },
  });
  const csc403 = await prisma.course.create({
    data: { code: 'CSC403', title: 'Advanced Database Systems', creditUnit: 3, departmentId: deptCSC.id },
  });
  const csc405 = await prisma.course.create({
    data: { code: 'CSC405', title: 'Artificial Intelligence Principles', creditUnit: 3, departmentId: deptCSC.id },
  });
  const eee401 = await prisma.course.create({
    data: { code: 'EEE401', title: 'Linear Circuit Analysis', creditUnit: 4, departmentId: deptEEE.id },
  });

  // 6. Assign Lecturers to Courses
  const assignCSC401 = await prisma.courseAssignment.create({
    data: { courseId: csc401.id, lecturerId: lecAlan.id, academicSession: '2025/2026', semester: 'FIRST' }
  });
  const assignCSC403 = await prisma.courseAssignment.create({
    data: { courseId: csc403.id, lecturerId: lecAda.id, academicSession: '2025/2026', semester: 'FIRST' }
  });
  const assignCSC405 = await prisma.courseAssignment.create({
    data: { courseId: csc405.id, lecturerId: lecAlan.id, academicSession: '2025/2026', semester: 'FIRST' }
  });
  const assignEEE401 = await prisma.courseAssignment.create({
    data: { courseId: eee401.id, lecturerId: lecGrace.id, academicSession: '2025/2026', semester: 'FIRST' }
  });

  // 7. Enroll Students in Courses
  await prisma.studentEnrollment.createMany({
    data: [
      { studentId: stuJohn.id, courseAssignmentId: assignCSC401.id, academicSession: '2025/2026', semester: 'FIRST' },
      { studentId: stuJohn.id, courseAssignmentId: assignCSC403.id, academicSession: '2025/2026', semester: 'FIRST' },
      { studentId: stuJane.id, courseAssignmentId: assignCSC401.id, academicSession: '2025/2026', semester: 'FIRST' },
      { studentId: stuJane.id, courseAssignmentId: assignCSC405.id, academicSession: '2025/2026', semester: 'FIRST' },
      { studentId: stuDavid.id, courseAssignmentId: assignEEE401.id, academicSession: '2025/2026', semester: 'FIRST' },
    ]
  });

  // 8. Create Evaluation Period
  const activePeriod = await prisma.evaluationPeriod.create({
    data: {
      title: '2025/2026 First Semester Main Evaluation',
      academicSession: '2025/2026',
      semester: 'FIRST',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-08-31'),
      isActive: true,
    }
  });

  // 9. Standard 9 Evaluation Criteria Questions
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

  const questions = [];
  for (const q of questionsData) {
    const created = await prisma.evaluationQuestion.create({ data: q });
    questions.push(created);
  }

  // 10. Create Sample Anonymous Evaluations
  // Evaluation by John Doe for Dr. Alan Turing (CSC401)
  const eval1 = await prisma.evaluation.create({
    data: {
      courseAssignmentId: assignCSC401.id,
      studentId: stuJohn.id,
      evaluationPeriodId: activePeriod.id,
      comment: 'Dr. Alan Turing is exceptionally clear in software architecture explanations. Excellent course!',
      ratings: {
        create: questions.map(q => ({
          questionId: q.id,
          rating: Math.floor(Math.random() * 2) + 4 // 4 or 5
        }))
      }
    }
  });

  // Evaluation by Jane Smith for Dr. Alan Turing (CSC401)
  const eval2 = await prisma.evaluation.create({
    data: {
      courseAssignmentId: assignCSC401.id,
      studentId: stuJane.id,
      evaluationPeriodId: activePeriod.id,
      comment: 'Punctual and very supportive during practical labs. Would recommend more code samples.',
      ratings: {
        create: questions.map(q => ({
          questionId: q.id,
          rating: 5
        }))
      }
    }
  });

  // Evaluation by John Doe for Prof. Ada Lovelace (CSC403)
  const eval3 = await prisma.evaluation.create({
    data: {
      courseAssignmentId: assignCSC403.id,
      studentId: stuJohn.id,
      evaluationPeriodId: activePeriod.id,
      comment: 'Prof. Ada makes SQL optimization look effortless. Great teaching style!',
      ratings: {
        create: questions.map(q => ({
          questionId: q.id,
          rating: 5
        }))
      }
    }
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
