import { pgTable, text, timestamp, uuid, varchar, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "coordinator"]);
export const notificationTypeEnum = pgEnum("notification_type", ["assignment", "grade", "announcement", "reminder"]);
export const notificationStatusEnum = pgEnum("notification_status", ["sent", "delivered", "read", "failed"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["assigned", "submitted", "graded", "returned"]);

// Users table (Better-Auth compatible with additional fields)
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // Additional fields for Semillero Digital
  googleId: varchar("google_id", { length: 255 }).unique(),
  role: userRoleEnum("role").default("student").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  googleClassroomToken: text("google_classroom_token"),
  googleRefreshToken: text("google_refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Courses table (synced from Google Classroom)
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 255 }).unique().notNull(), // Google Classroom ID
  name: varchar("name", { length: 255 }).notNull(),
  section: varchar("section", { length: 255 }),
  description: text("description"),
  room: varchar("room", { length: 100 }),
  state: varchar("state", { length: 50 }).default("ACTIVE"),
  ownerGoogleId: varchar("owner_google_id", { length: 255 }),
  enrollmentCode: varchar("enrollment_code", { length: 50 }),
  alternateLink: text("alternate_link"),
  teacherGroupEmail: varchar("teacher_group_email", { length: 255 }),
  courseGroupEmail: varchar("course_group_email", { length: 255 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course enrollments table
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  roleInCourse: varchar("role_in_course", { length: 50 }).default("STUDENT").notNull(), // STUDENT, TEACHER, OWNER
  externalId: varchar("external_id", { length: 255 }), // Google user ID in the course context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Coursework table (synced from Google Classroom)
export const coursework = pgTable("coursework", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 255 }).unique().notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  state: varchar("state", { length: 50 }).default("PUBLISHED"),
  maxPoints: integer("max_points"),
  dueDate: timestamp("due_date"),
  topicId: varchar("topic_id", { length: 255 }),
  alternateLink: text("alternate_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Student submissions table (synced from Google Classroom)
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 255 }).unique().notNull(),
  courseworkId: uuid("coursework_id").references(() => coursework.id).notNull(),
  studentId: text("student_id").references(() => users.id).notNull(),
  state: varchar("state", { length: 50 }).default("NEW").notNull(),
  late: boolean("late").default(false),
  assignedAt: timestamp("assigned_at"),
  turnedInAt: timestamp("turned_in_at"),
  returnedAt: timestamp("returned_at"),
  draftGrade: integer("draft_grade"),
  assignedGrade: integer("assigned_grade"),
  finalGrade: integer("final_grade"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Topics table (synced from Google Classroom)
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 255 }).unique().notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("order").default(0),
});

// Student progress tracking table
export const studentProgress = pgTable("student_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").references(() => users.id).notNull(),
  courseId: uuid("course_id").references(() => courses.id).notNull(),
  totalAssignments: integer("total_assignments").default(0),
  completedAssignments: integer("completed_assignments").default(0),
  averageGrade: integer("average_grade"),
  attendanceRate: integer("attendance_rate"),
  lastActivity: timestamp("last_activity"),
  completionRate: integer("completion_rate").default(0),
  onTimeSubmissions: integer("on_time_submissions").default(0),
  lateSubmissions: integer("late_submissions").default(0),
  missedAssignments: integer("missed_assignments").default(0),
  progressData: jsonb("progress_data"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications and communications log
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: text("recipient_id").references(() => users.id).notNull(),
  senderId: text("sender_id").references(() => users.id),
  courseId: uuid("course_id").references(() => courses.id),
  assignmentId: uuid("assignment_id").references(() => coursework.id),
  type: notificationTypeEnum("type").notNull(),
  status: notificationStatusEnum("status").default("sent").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  channels: jsonb("channels"), // email, whatsapp, telegram, etc.
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table (Better-Auth compatible)
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  submissions: many(submissions),
  studentProgress: many(studentProgress),
  sentNotifications: many(notifications, { relationName: "sender" }),
  receivedNotifications: many(notifications, { relationName: "recipient" }),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
  coursework: many(coursework),
  topics: many(topics),
  studentProgress: many(studentProgress),
  notifications: many(notifications),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
}));

export const courseworkRelations = relations(coursework, ({ one, many }) => ({
  course: one(courses, {
    fields: [coursework.courseId],
    references: [courses.id],
  }),
  submissions: many(submissions),
}));

export const topicsRelations = relations(topics, ({ one }) => ({
  course: one(courses, {
    fields: [topics.courseId],
    references: [courses.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  coursework: one(coursework, {
    fields: [submissions.courseworkId],
    references: [coursework.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  student: one(users, {
    fields: [studentProgress.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [studentProgress.courseId],
    references: [courses.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  course: one(courses, {
    fields: [notifications.courseId],
    references: [courses.id],
  }),
  coursework: one(coursework, {
    fields: [notifications.assignmentId],
    references: [coursework.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
