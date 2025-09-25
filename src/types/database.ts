import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  courses,
  courseEnrollments,
  assignments,
  submissions,
  studentProgress,
  notifications,
  sessions,
  accounts,
  verifications,
} from "@/lib/db/schema";

// Base database types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Course = InferSelectModel<typeof courses>;
export type NewCourse = InferInsertModel<typeof courses>;

export type CourseEnrollment = InferSelectModel<typeof courseEnrollments>;
export type NewCourseEnrollment = InferInsertModel<typeof courseEnrollments>;

export type Assignment = InferSelectModel<typeof assignments>;
export type NewAssignment = InferInsertModel<typeof assignments>;

export type Submission = InferSelectModel<typeof submissions>;
export type NewSubmission = InferInsertModel<typeof submissions>;

export type StudentProgress = InferSelectModel<typeof studentProgress>;
export type NewStudentProgress = InferInsertModel<typeof studentProgress>;

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Verification = InferSelectModel<typeof verifications>;
export type NewVerification = InferInsertModel<typeof verifications>;

// Enum types
export type UserRole = "student" | "teacher" | "coordinator";
export type NotificationType = "assignment" | "grade" | "announcement" | "reminder";
export type NotificationStatus = "sent" | "delivered" | "read" | "failed";
export type AssignmentStatus = "assigned" | "submitted" | "graded" | "returned";

// Extended types with relations
export interface UserWithEnrollments extends User {
  enrollments: CourseEnrollmentWithCourse[];
}

export interface CourseWithEnrollments extends Course {
  enrollments: CourseEnrollmentWithUser[];
  owner?: User;
}

export interface CourseEnrollmentWithUser extends CourseEnrollment {
  user: User;
}

export interface CourseEnrollmentWithCourse extends CourseEnrollment {
  course: Course;
}

export interface AssignmentWithCourse extends Assignment {
  course: Course;
  submissions?: SubmissionWithStudent[];
}

export interface SubmissionWithStudent extends Submission {
  student: User;
  assignment?: Assignment;
  course?: Course;
}

export interface SubmissionWithAssignment extends Submission {
  assignment: Assignment;
  student: User;
}

export interface StudentProgressWithUser extends StudentProgress {
  student: User;
  course: Course;
}

export interface NotificationWithRelations extends Notification {
  recipient: User;
  sender?: User;
  course?: Course;
  assignment?: Assignment;
}

// Dashboard data types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalAssignments: number;
  activeUsers: number;
  completedAssignments: number;
  pendingAssignments: number;
}

export interface StudentDashboardData {
  user: User;
  enrollments: CourseEnrollmentWithCourse[];
  recentAssignments: AssignmentWithCourse[];
  upcomingDeadlines: AssignmentWithCourse[];
  notifications: NotificationWithRelations[];
  progress: StudentProgressWithUser[];
}

export interface TeacherDashboardData {
  user: User;
  courses: CourseWithEnrollments[];
  recentAssignments: AssignmentWithCourse[];
  pendingSubmissions: SubmissionWithStudent[];
  notifications: NotificationWithRelations[];
}

export interface CoordinatorDashboardData {
  user: User;
  stats: DashboardStats;
  courses: CourseWithEnrollments[];
  recentActivity: NotificationWithRelations[];
  userStats: {
    total: number;
    active: number;
    students: number;
    teachers: number;
    coordinators: number;
  };
}

// Google Classroom integration types
export interface GoogleClassroomCourse {
  id: string;
  name: string;
  section?: string;
  description?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: string;
  alternateLink: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
}

export interface GoogleClassroomAssignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  materials?: any[];
  state: string;
  maxPoints?: number;
  workType: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  creationTime: string;
  updateTime: string;
  alternateLink: string;
}

export interface GoogleClassroomSubmission {
  id: string;
  userId: string;
  courseId: string;
  courseWorkId: string;
  assignmentSubmission?: {
    attachments?: any[];
  };
  shortAnswerSubmission?: {
    answer: string;
  };
  multipleChoiceSubmission?: {
    answer: string;
  };
  state: string;
  late: boolean;
  draftGrade?: number;
  assignedGrade?: number;
  alternateLink: string;
  courseWorkType: string;
  creationTime: string;
  updateTime: string;
  submissionHistory: any[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types for updates
export interface UpdateUserForm {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateCourseForm {
  name: string;
  section?: string;
  description?: string;
  room?: string;
}

export interface UpdateCourseForm extends CreateCourseForm {
  isActive?: boolean;
}

export interface CreateAssignmentForm {
  courseId: string;
  title: string;
  description?: string;
  maxPoints?: number;
  dueDate?: Date;
}

export interface UpdateAssignmentForm extends CreateAssignmentForm {
  isActive?: boolean;
}

export interface CreateNotificationForm {
  recipientId?: string;
  courseId?: string;
  assignmentId?: string;
  type: NotificationType;
  title: string;
  message: string;
  scheduledFor?: Date;
  channels?: string[];
}

// Progress tracking types
export interface ProgressMetrics {
  completionRate: number;
  averageGrade: number;
  onTimeSubmissionRate: number;
  attendanceRate: number;
  totalAssignments: number;
  completedAssignments: number;
  missedAssignments: number;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  metrics: ProgressMetrics;
  recentActivity: {
    date: Date;
    type: string;
    description: string;
  }[];
}

export interface StudentAnalytics {
  studentId: string;
  studentName: string;
  overallProgress: ProgressMetrics;
  courseProgress: CourseProgress[];
  timeSpentAnalysis: {
    weeklyHours: number;
    mostActiveDay: string;
    averageSessionLength: number;
  };
}

// Filter and search types
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  courseId?: string;
}

export interface CourseFilters {
  isActive?: boolean;
  search?: string;
  ownerId?: string;
}

export interface AssignmentFilters {
  courseId?: string;
  state?: string;
  dueAfter?: Date;
  dueBefore?: Date;
  search?: string;
}

export interface SubmissionFilters {
  courseId?: string;
  assignmentId?: string;
  studentId?: string;
  state?: AssignmentStatus;
  late?: boolean;
}

export interface NotificationFilters {
  recipientId?: string;
  senderId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  courseId?: string;
  unreadOnly?: boolean;
}
