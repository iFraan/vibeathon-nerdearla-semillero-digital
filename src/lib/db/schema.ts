import { pgTable, text, timestamp, varchar, integer, decimal, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  image: text("image"),
  role: varchar("role", { length: 50 }).notNull().$type<"student" | "teacher" | "coordinator">(),
  googleId: varchar("google_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  googleClassroomId: varchar("google_classroom_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  teacherId: text("teacher_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
}, (table) => {
  return {
    userCourseIdx: uniqueIndex("user_course_idx").on(table.userId, table.courseId),
  };
});

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  googleClassroomId: varchar("google_classroom_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  maxPoints: decimal("max_points", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  googleSubmissionId: varchar("google_submission_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().$type<"assigned" | "returned" | "turned_in" | "new" | "created">(),
  grade: decimal("grade", { precision: 10, scale: 2 }),
  submittedAt: timestamp("submitted_at"),
  gradedAt: timestamp("graded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    assignmentStudentIdx: uniqueIndex("assignment_student_idx").on(table.assignmentId, table.studentId),
  };
});

export const studentProgress = pgTable("student_progress", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  completionPercentage: integer("completion_percentage").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => {
  return {
    studentAssignmentIdx: uniqueIndex("student_assignment_idx").on(table.studentId, table.assignmentId),
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  courses: many(courses),
  students: many(students),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  students: many(students),
  assignments: many(assignments),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [students.courseId],
    references: [courses.id],
  }),
  submissions: many(submissions),
  progress: many(studentProgress),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
  submissions: many(submissions),
  progress: many(studentProgress),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(students, {
    fields: [submissions.studentId],
    references: [students.id],
  }),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  student: one(students, {
    fields: [studentProgress.studentId],
    references: [students.id],
  }),
  assignment: one(assignments, {
    fields: [studentProgress.assignmentId],
    references: [assignments.id],
  }),
}));
