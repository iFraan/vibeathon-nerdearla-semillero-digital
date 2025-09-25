import { eq, and, or, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { users, courseEnrollments, courses, type UserRole } from "./db/schema";

export interface UserWithEnrollments {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  enrollments?: {
    id: string;
    courseId: string;
    courseName: string;
    role: string;
    enrolledAt: Date;
    isActive: boolean;
  }[];
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  courseId?: string;
}

export interface UserUpdate {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export class UserManagementService {
  // Get user by ID with enrollments
  async getUserById(id: string): Promise<UserWithEnrollments | null> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        enrollmentId: courseEnrollments.id,
        courseId: courseEnrollments.courseId,
        courseName: courses.name,
        enrollmentRole: courseEnrollments.role,
        enrolledAt: courseEnrollments.enrolledAt,
        enrollmentActive: courseEnrollments.isActive,
      })
      .from(users)
      .leftJoin(courseEnrollments, eq(users.id, courseEnrollments.userId))
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(users.id, id));

    if (result.length === 0) return null;

    const user = result[0];
    const enrollments = result
      .filter((row) => row.enrollmentId !== null)
      .map((row) => ({
        id: row.enrollmentId!,
        courseId: row.courseId!,
        courseName: row.courseName!,
        role: row.enrollmentRole!,
        enrolledAt: row.enrolledAt!,
        isActive: row.enrollmentActive!,
      }));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      enrollments,
    };
  }

  // Get all users with filtering
  async getUsers(filters: UserFilters = {}): Promise<UserWithEnrollments[]> {
    const { role, isActive, search, courseId } = filters;
    
    let query = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    const conditions = [];

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (typeof isActive === 'boolean') {
      conditions.push(eq(users.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          eq(users.name, `%${search}%`),
          eq(users.email, `%${search}%`)
        )
      );
    }

    if (courseId) {
      query = query
        .innerJoin(courseEnrollments, eq(users.id, courseEnrollments.userId))
        .where(
          and(
            eq(courseEnrollments.courseId, courseId),
            eq(courseEnrollments.isActive, true),
            ...conditions
          )
        );
    } else if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(asc(users.name));

    return result.map((user) => ({
      ...user,
      enrollments: [],
    }));
  }

  // Update user role and information
  async updateUser(id: string, updates: UserUpdate): Promise<UserWithEnrollments | null> {
    await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return this.getUserById(id);
  }

  // Promote user to coordinator
  async promoteToCoordinator(id: string): Promise<UserWithEnrollments | null> {
    return this.updateUser(id, { role: "coordinator" });
  }

  // Demote coordinator to teacher
  async demoteToTeacher(id: string): Promise<UserWithEnrollments | null> {
    return this.updateUser(id, { role: "teacher" });
  }

  // Activate/deactivate user
  async toggleUserStatus(id: string): Promise<UserWithEnrollments | null> {
    const user = await this.getUserById(id);
    if (!user) return null;

    return this.updateUser(id, { isActive: !user.isActive });
  }

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<UserWithEnrollments[]> {
    return this.getUsers({ role });
  }

  // Get students in a course
  async getStudentsInCourse(courseId: string): Promise<UserWithEnrollments[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        enrolledAt: courseEnrollments.enrolledAt,
        enrollmentRole: courseEnrollments.role,
      })
      .from(users)
      .innerJoin(courseEnrollments, eq(users.id, courseEnrollments.userId))
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.isActive, true),
          eq(users.isActive, true)
        )
      )
      .orderBy(asc(users.name));

    return result.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      enrollments: [{
        id: '', // This would need to be populated separately if needed
        courseId,
        courseName: '', // This would need to be populated separately if needed
        role: user.enrollmentRole,
        enrolledAt: user.enrolledAt,
        isActive: true,
      }],
    }));
  }

  // Get teachers for a course
  async getTeachersInCourse(courseId: string): Promise<UserWithEnrollments[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        enrolledAt: courseEnrollments.enrolledAt,
        enrollmentRole: courseEnrollments.role,
      })
      .from(users)
      .innerJoin(courseEnrollments, eq(users.id, courseEnrollments.userId))
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.isActive, true),
          eq(users.isActive, true),
          or(
            eq(courseEnrollments.role, "teacher"),
            eq(courseEnrollments.role, "owner")
          )
        )
      )
      .orderBy(asc(users.name));

    return result.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      enrollments: [{
        id: '',
        courseId,
        courseName: '',
        role: user.enrollmentRole,
        enrolledAt: user.enrolledAt,
        isActive: true,
      }],
    }));
  }

  // Enroll user in course
  async enrollUserInCourse(
    userId: string,
    courseId: string,
    role: string = "student"
  ): Promise<void> {
    await db.insert(courseEnrollments).values({
      userId,
      courseId,
      role,
      isActive: true,
    });
  }

  // Remove user from course
  async removeUserFromCourse(userId: string, courseId: string): Promise<void> {
    await db
      .update(courseEnrollments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      );
  }

  // Get user statistics
  async getUserStats() {
    const stats = await db
      .select({
        role: users.role,
        isActive: users.isActive,
      })
      .from(users);

    return {
      total: stats.length,
      active: stats.filter((u) => u.isActive).length,
      inactive: stats.filter((u) => !u.isActive).length,
      students: stats.filter((u) => u.role === "student").length,
      teachers: stats.filter((u) => u.role === "teacher").length,
      coordinators: stats.filter((u) => u.role === "coordinator").length,
    };
  }
}

export const userManagement = new UserManagementService();
