export type UserRole = "student" | "teacher" | "coordinator";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  googleClassroomId: string;
  name: string;
  description?: string;
  teacherId: string;
  students: Student[];
  assignments: Assignment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: StudentProgress[];
}

export interface Assignment {
  id: string;
  courseId: string;
  googleClassroomId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  maxPoints?: number;
  submissions: Submission[];
  createdAt: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  googleSubmissionId: string;
  status: "assigned" | "returned" | "turned_in" | "new" | "created";
  grade?: number;
  submittedAt?: Date;
  gradedAt?: Date;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  assignmentId: string;
  completionPercentage: number;
  lastUpdated: Date;
}

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  averageProgress: number;
  upcomingDeadlines: number;
}
