import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  users, 
  courses, 
  enrollments, 
  coursework, 
  topics,
  submissions, 
  studentProgress
} from '../src/lib/db/schema';
import { randomBytes, randomUUID } from 'crypto';

// Load environment variables
config({ path: '.env.local' });

// Seeded random number generator for reproducible results
class SeededRandom {
  private seed: number;
  private value: number;

  constructor(seed: number) {
    this.seed = seed;
    this.value = seed;
  }

  next(): number {
    // Linear Congruential Generator
    this.value = (this.value * 16807) % 2147483647;
    return this.value / 2147483647;
  }

  integer(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  weighted(weights: number[]): number {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let random = this.next() * total;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) return i;
    }
    return weights.length - 1;
  }

  date(startDays: number, endDays: number): Date {
    const now = new Date();
    const start = new Date(now.getTime() + startDays * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + endDays * 24 * 60 * 60 * 1000);
    const randomTime = start.getTime() + this.next() * (end.getTime() - start.getTime());
    return new Date(randomTime);
  }
}

// Get or generate seed
const getSeed = (): number => {
  if (process.env.SEED) {
    return parseInt(process.env.SEED, 10);
  }
  // Generate random seed if not provided
  return Math.floor(Math.random() * 1000000);
};

const generateNames = (rng: SeededRandom, count: number): string[] => {
  const firstNames = [
    'Ana', 'Carlos', 'María', 'Juan', 'Sofía', 'Miguel', 'Valentina', 'Diego', 
    'Isabella', 'Alejandro', 'Camila', 'Sebastián', 'Lucía', 'Mateo', 'Gabriela',
    'Santiago', 'Emilia', 'Nicolás', 'Victoria', 'Daniel', 'Mariana', 'David',
    'Antonella', 'Samuel', 'Regina', 'Gabriel', 'Catalina', 'Tomás', 'Fernanda',
    'Lucas', 'Paulina', 'Martín', 'Valeria', 'Rodrigo', 'Ximena', 'Emanuel'
  ];
  
  const lastNames = [
    'García', 'Rodríguez', 'López', 'González', 'Martínez', 'Pérez', 'Sánchez',
    'Ramírez', 'Cruz', 'Vargas', 'Castillo', 'Morales', 'Ortega', 'Delgado',
    'Castro', 'Ortiz', 'Rubio', 'Marín', 'Soto', 'Contreras', 'Silva', 'Gómez',
    'Herrera', 'Medina', 'Ruiz', 'Flores', 'Jiménez', 'Álvarez', 'Romero',
    'Mendoza', 'Aguilar', 'Torres', 'Domínguez', 'Vásquez', 'Moreno', 'Gutiérrez'
  ];

  const names = new Set<string>();
  let attempts = 0;
  
  while (names.size < count && attempts < count * 10) {
    const firstName = rng.choice(firstNames);
    const lastName = rng.choice(lastNames);
    const fullName = `${firstName} ${lastName}`;
    names.add(fullName);
    attempts++;
  }

  return Array.from(names);
};

const generateEmail = (name: string, index: number): string => {
  return `${name.toLowerCase().replace(/[^a-z]/g, '')}${index}@semillero.digital`;
};

async function seed() {
  const seed = getSeed();
  const rng = new SeededRandom(seed);
  
  console.log(`🌱 Seeding database with seed: ${seed}`);

  // Database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  const client = postgres(connectionString);
  const db = drizzle(client, { 
    schema: { users, courses, enrollments, coursework, topics, submissions, studentProgress }
  });

  try {
    console.log('🧹 Cleaning existing data...');
    await db.delete(studentProgress);
    await db.delete(submissions);
    await db.delete(coursework);
    await db.delete(topics);
    await db.delete(enrollments);
    await db.delete(courses);
    await db.delete(users);

    // Generate names for all users
    const studentNames = generateNames(rng, 300);
    const teacherNames = generateNames(rng, 30);

    console.log('👥 Creating users...');

    // Create demo user first
    const demoUser = {
      id: 'demo-user-id',
      name: 'Usuario Demo',
      email: 'demo@semillero.digital',
      emailVerified: true,
      role: 'student' as const,
      googleId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create students
    const studentsData = studentNames.map((name, index) => ({
      id: `student_${index + 1}`,
      name,
      email: generateEmail(name, index + 1),
      emailVerified: true,
      role: 'student' as const,
      googleId: `google_student_${index + 1}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Create teachers (30 teachers, each managing 10 students)
    const teachersData = teacherNames.map((name, index) => ({
      id: `teacher_${index + 1}`,
      name,
      email: generateEmail(name, index + 301),
      emailVerified: true,
      role: 'teacher' as const,
      googleId: `google_teacher_${index + 1}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(users).values([demoUser, ...studentsData, ...teachersData]);

    console.log('📚 Creating courses...');

    // Generate UUIDs for courses (deterministic based on seed)
    const courseIds = [randomUUID(), randomUUID()];

    // Create exactly 2 courses
    const coursesData = [
      {
        id: courseIds[0],
        externalId: 'gc_ecommerce_2024',
        name: 'Especialista en eCommerce',
        section: 'Cohorte 2024-A',
        description: 'Curso especializado en comercio electrónico y tiendas online',
        state: 'ACTIVE',
        ownerGoogleId: 'google_teacher_1',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: courseIds[1],
        externalId: 'gc_marketing_2024',
        name: 'Semillero Digital: Especialista en Marketing Digital',
        section: 'Cohorte 2024-B',
        description: 'Curso especializado en marketing digital y redes sociales',
        state: 'ACTIVE',
        ownerGoogleId: 'google_teacher_16',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-07-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await db.insert(courses).values(coursesData);

    console.log('📝 Creating topics (modules)...');

    // Create 3 modules per course
    const topicsData = [];
    const topicIds: string[] = [];
    const modules = [
      ['Fundamentos del eCommerce', 'Plataformas y Herramientas', 'Estrategias Avanzadas'],
      ['Fundamentos del Marketing', 'Redes Sociales y Contenido', 'Analytics y Optimización']
    ];

    for (let courseIndex = 0; courseIndex < 2; courseIndex++) {
      for (let moduleIndex = 0; moduleIndex < 3; moduleIndex++) {
        const topicId = randomUUID();
        topicIds.push(topicId);
        
        topicsData.push({
          id: topicId,
          externalId: `gc_topic_c${courseIndex + 1}_m${moduleIndex + 1}`,
          courseId: courseIds[courseIndex],
          name: modules[courseIndex][moduleIndex],
          order: moduleIndex + 1,
        });
      }
    }

    await db.insert(topics).values(topicsData);

    console.log('📋 Creating coursework (assignments)...');

    // Create 3 assignments per module (9 per course)
    const courseworkData = [];
    const courseworkIds: string[] = [];
    const assignmentTemplates = [
      'Tarea 1', 'Tarea 2', 'Proyecto Final'
    ];

    for (let courseIndex = 0; courseIndex < 2; courseIndex++) {
      for (let moduleIndex = 0; moduleIndex < 3; moduleIndex++) {
        for (let assignmentIndex = 0; assignmentIndex < 3; assignmentIndex++) {
          const dueDate = rng.date(-60, 15); // Between 60 days ago and 15 days from now
          const courseworkId = randomUUID();
          courseworkIds.push(courseworkId);
          
          courseworkData.push({
            id: courseworkId,
            externalId: `gc_coursework_c${courseIndex + 1}_m${moduleIndex + 1}_a${assignmentIndex + 1}`,
            courseId: courseIds[courseIndex],
            title: `${modules[courseIndex][moduleIndex]} - ${assignmentTemplates[assignmentIndex]}`,
            description: `Actividad práctica del módulo ${modules[courseIndex][moduleIndex]}`,
            state: 'PUBLISHED',
            maxPoints: 100,
            dueDate,
            topicId: `gc_topic_c${courseIndex + 1}_m${moduleIndex + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    await db.insert(coursework).values(courseworkData);

    console.log('🎓 Creating enrollments...');

    // Enroll students (150 per course)
    const enrollmentsData = [];
    
    // Enroll demo user in both courses
    for (let courseIndex = 0; courseIndex < 2; courseIndex++) {
      enrollmentsData.push({
        id: randomUUID(),
        courseId: courseIds[courseIndex],
        userId: 'demo-user-id',
        roleInCourse: 'STUDENT',
        externalId: `gc_demo_user_course_${courseIndex + 1}`,
        createdAt: new Date(),
      });
    }
    
    // Distribute students evenly across courses (150 each)
    for (let studentIndex = 0; studentIndex < 300; studentIndex++) {
      const courseIndex = Math.floor(studentIndex / 150);
      enrollmentsData.push({
        id: randomUUID(),
        courseId: courseIds[courseIndex],
        userId: `student_${studentIndex + 1}`,
        roleInCourse: 'STUDENT',
        externalId: `gc_student_${studentIndex + 1}_course_${courseIndex + 1}`,
        createdAt: new Date(),
      });
    }

    // Enroll teachers (15 per course)
    for (let teacherIndex = 0; teacherIndex < 30; teacherIndex++) {
      const courseIndex = Math.floor(teacherIndex / 15);
      enrollmentsData.push({
        id: randomUUID(),
        courseId: courseIds[courseIndex],
        userId: `teacher_${teacherIndex + 1}`,
        roleInCourse: 'TEACHER',
        externalId: `gc_teacher_${teacherIndex + 1}_course_${courseIndex + 1}`,
        createdAt: new Date(),
      });
    }

    await db.insert(enrollments).values(enrollmentsData);

    console.log('📤 Creating submissions with weighted probabilities...');

    // Task status probabilities: 55% entregada, 25% pendiente, 15% atrasada, 5% no_entregada
    const statusWeights = [0.55, 0.25, 0.15, 0.05]; // entregada, pendiente, atrasada, no_entregada
    const statusMapping = ['RETURNED', 'NEW', 'LATE', 'MISSED']; // Maps to submission states
    const submissionsData = [];

    // Create submissions for demo user in both courses (all assignments)
    for (let courseIndex = 0; courseIndex < 2; courseIndex++) {
      for (let moduleIndex = 0; moduleIndex < 3; moduleIndex++) {
        for (let assignmentIndex = 0; assignmentIndex < 3; assignmentIndex++) {
          const courseworkIndex = courseIndex * 9 + moduleIndex * 3 + assignmentIndex;
          const courseworkId = courseworkIds[courseworkIndex];
          const statusIndex = rng.weighted(statusWeights);
          const status = statusMapping[statusIndex];
          
          const submission: any = {
            id: randomUUID(),
            externalId: `gc_submission_demo_cw${courseworkIndex}`,
            courseworkId,
            studentId: 'demo-user-id',
            state: status,
            late: status === 'LATE',
            assignedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Add submission details based on status
          if (status === 'RETURNED') {
            submission.turnedInAt = rng.date(-45, -1);
            submission.returnedAt = rng.date(-30, 0);
            submission.finalGrade = rng.integer(70, 100);
            submission.assignedGrade = submission.finalGrade;
          } else if (status === 'LATE') {
            submission.turnedInAt = rng.date(-15, 0);
            submission.finalGrade = rng.integer(60, 90);
            submission.assignedGrade = submission.finalGrade;
          }

          submissionsData.push(submission);
        }
      }
    }

    // Create submissions for each student for each assignment
    for (let studentIndex = 0; studentIndex < 300; studentIndex++) {
      const courseIndex = Math.floor(studentIndex / 150);
      
      for (let moduleIndex = 0; moduleIndex < 3; moduleIndex++) {
        for (let assignmentIndex = 0; assignmentIndex < 3; assignmentIndex++) {
          const courseworkIndex = courseIndex * 9 + moduleIndex * 3 + assignmentIndex;
          const courseworkId = courseworkIds[courseworkIndex];
          const statusIndex = rng.weighted(statusWeights);
          const status = statusMapping[statusIndex];
          
          const submission: any = {
            id: randomUUID(),
            externalId: `gc_submission_s${studentIndex + 1}_cw${courseworkIndex}`,
            courseworkId,
            studentId: `student_${studentIndex + 1}`,
            state: status,
            late: status === 'LATE',
            assignedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Add submission details based on status
          if (status === 'RETURNED') {
            submission.turnedInAt = rng.date(-45, -1);
            submission.returnedAt = rng.date(-30, 0);
            submission.finalGrade = rng.integer(70, 100);
            submission.assignedGrade = submission.finalGrade;
          } else if (status === 'LATE') {
            submission.turnedInAt = rng.date(-15, 0);
            submission.finalGrade = rng.integer(60, 90);
            submission.assignedGrade = submission.finalGrade;
          }

          submissionsData.push(submission);
        }
      }
    }

    await db.insert(submissions).values(submissionsData);

    console.log('📊 Calculating student progress metrics...');

    const progressData = [];

    // Create progress data for demo user in both courses
    for (let courseIndex = 0; courseIndex < 2; courseIndex++) {
      const studentId = 'demo-user-id';
      const courseId = courseIds[courseIndex];

      // Count submissions by status for demo user in this course
      const studentSubmissions = submissionsData.filter(s => 
        s.studentId === studentId && 
        courseworkIds.includes(s.courseworkId) &&
        courseworkIds.indexOf(s.courseworkId) >= courseIndex * 9 && 
        courseworkIds.indexOf(s.courseworkId) < (courseIndex + 1) * 9
      );
      const totalAssignments = 9; // 9 assignments per course
      
      const completedAssignments = studentSubmissions.filter(s => s.state === 'RETURNED').length;
      const lateSubmissions = studentSubmissions.filter(s => s.state === 'LATE').length;
      const missedAssignments = studentSubmissions.filter(s => s.state === 'MISSED').length;
      const onTimeSubmissions = completedAssignments; // Assuming RETURNED means on time
      
      // Calculate metrics
      const completionRate = Math.round((completedAssignments / totalAssignments) * 100);
      const riskLevel = Math.round(((lateSubmissions * 0.3 + missedAssignments * 0.7) / totalAssignments) * 100);
      
      // Calculate average grade from completed assignments
      const gradedSubmissions = studentSubmissions.filter(s => s.finalGrade);
      const averageGrade = gradedSubmissions.length > 0 
        ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.finalGrade!, 0) / gradedSubmissions.length)
        : null;

      progressData.push({
        id: randomUUID(),
        studentId,
        courseId,
        totalAssignments,
        completedAssignments,
        averageGrade,
        attendanceRate: rng.integer(75, 100), // Random attendance rate
        lastActivity: rng.date(-7, 0), // Last activity within last week
        completionRate,
        onTimeSubmissions,
        lateSubmissions,
        missedAssignments,
        progressData: {
          riskLevel,
          modules: {
            module1: rng.integer(60, 100),
            module2: rng.integer(60, 100),
            module3: rng.integer(60, 100),
          },
        },
        calculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    for (let studentIndex = 0; studentIndex < 300; studentIndex++) {
      const courseIndex = Math.floor(studentIndex / 150);
      const studentId = `student_${studentIndex + 1}`;
      const courseId = courseIds[courseIndex];

      // Count submissions by status for this student
      const studentSubmissions = submissionsData.filter(s => s.studentId === studentId);
      const totalAssignments = studentSubmissions.length; // Should be 9
      
      const completedAssignments = studentSubmissions.filter(s => s.state === 'RETURNED').length;
      const lateSubmissions = studentSubmissions.filter(s => s.state === 'LATE').length;
      const missedAssignments = studentSubmissions.filter(s => s.state === 'MISSED').length;
      const onTimeSubmissions = completedAssignments; // Assuming RETURNED means on time
      
      // Calculate metrics
      const completionRate = Math.round((completedAssignments / totalAssignments) * 100);
      const riskLevel = Math.round(((lateSubmissions * 0.3 + missedAssignments * 0.7) / totalAssignments) * 100);
      
      // Calculate average grade from completed assignments
      const gradedSubmissions = studentSubmissions.filter(s => s.finalGrade);
      const averageGrade = gradedSubmissions.length > 0 
        ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.finalGrade!, 0) / gradedSubmissions.length)
        : null;

      progressData.push({
        id: randomUUID(),
        studentId,
        courseId,
        totalAssignments,
        completedAssignments,
        averageGrade,
        attendanceRate: rng.integer(75, 100), // Random attendance rate
        lastActivity: rng.date(-7, 0), // Last activity within last week
        completionRate,
        onTimeSubmissions,
        lateSubmissions,
        missedAssignments,
        progressData: {
          riskLevel,
          modules: {
            module1: rng.integer(60, 100),
            module2: rng.integer(60, 100),
            module3: rng.integer(60, 100),
          },
        },
        calculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.insert(studentProgress).values(progressData);

    // Calculate and display final metrics
    const totalTasks = 300 * 9; // 300 students * 9 tasks each
    const completedTasks = submissionsData.filter(s => s.state === 'RETURNED').length;
    const pendingTasks = submissionsData.filter(s => s.state === 'NEW').length;
    const lateTasks = submissionsData.filter(s => s.state === 'LATE').length;
    const missedTasks = submissionsData.filter(s => s.state === 'MISSED').length;

    const studentsWithAllCompleted = progressData.filter(p => p.completedAssignments === 9).length;
    const completionPercentage = Math.round((studentsWithAllCompleted / 300) * 100);

    console.log('\n📈 Final Metrics:');
    console.log(`🎯 Seed used: ${seed}`);
    console.log(`👥 Students: 300`);
    console.log(`👨‍🏫 Teachers: 30 (each managing 10 students)`);
    console.log(`📚 Courses: 2`);
    console.log(`📝 Modules per course: 3`);
    console.log(`📋 Tasks per module: 3`);
    console.log(`📊 Total tasks: ${totalTasks}`);
    console.log(`✅ Completed (entregada): ${completedTasks} (${Math.round(completedTasks/totalTasks*100)}%)`);
    console.log(`⏳ Pending (pendiente): ${pendingTasks} (${Math.round(pendingTasks/totalTasks*100)}%)`);
    console.log(`⏰ Late (atrasada): ${lateTasks} (${Math.round(lateTasks/totalTasks*100)}%)`);
    console.log(`❌ Not delivered (no_entregada): ${missedTasks} (${Math.round(missedTasks/totalTasks*100)}%)`);
    console.log(`🎓 Students with all tasks completed: ${studentsWithAllCompleted}`);
    console.log(`📊 Completion percentage: ${completionPercentage}%`);

    console.log('\n✅ Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed().catch(console.error);
}

export default seed;
