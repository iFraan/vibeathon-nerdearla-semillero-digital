import { db } from '@/lib/database';
import { courses, submissions, coursework, enrollments, studentProgress } from '@/lib/db/schema';
import { eq, and, sql, count, avg, sum } from 'drizzle-orm';

export interface ProgressMetrics {
  completionRate: number;
  averageGrade: number | null;
  onTimeSubmissionRate: number;
  totalAssignments: number;
  completedAssignments: number;
  lateAssignments: number;
  missedAssignments: number;
  lastActivity?: Date;
}

export interface StudentCourseProgress extends ProgressMetrics {
  studentId: string;
  courseId: string;
  courseName: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CourseMetrics {
  courseId: string;
  courseName: string;
  totalStudents: number;
  activeStudents: number;
  averageCompletion: number;
  averageGrade: number | null;
  studentsAtRisk: number;
}

export class ProgressService {
  async getStudentCourseProgress(studentId: string, courseId: string): Promise<StudentCourseProgress | null> {
    try {
      // Get course info
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        columns: { id: true, name: true }
      });

      if (!course) return null;

      // Get all coursework for this course
      const allCoursework = await db.query.coursework.findMany({
        where: eq(coursework.courseId, courseId),
        columns: { id: true }
      });

      const totalAssignments = allCoursework.length;

      if (totalAssignments === 0) {
        return {
          studentId,
          courseId,
          courseName: course.name,
          completionRate: 0,
          averageGrade: null,
          onTimeSubmissionRate: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          lateAssignments: 0,
          missedAssignments: 0,
          riskLevel: 'low'
        };
      }

      // Get student submissions
      const studentSubmissions = await db.query.submissions.findMany({
        where: and(
          eq(submissions.studentId, studentId),
        ),
        with: {
          coursework: {
            columns: { id: true, dueDate: true, courseId: true }
          }
        }
      });

      // Filter submissions that belong to this course
      const courseSubmissions = studentSubmissions.filter(s => 
        s.coursework && s.coursework.courseId === courseId
      );

      // Calculate metrics
      const completedAssignments = courseSubmissions.filter(s => 
        s.state === 'TURNED_IN' || s.state === 'RETURNED' || s.assignedGrade !== null
      ).length;

      const lateAssignments = courseSubmissions.filter(s => s.late).length;
      const missedAssignments = totalAssignments - courseSubmissions.length;

      const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
      
      const submissionsWithGrades = courseSubmissions.filter(s => s.finalGrade !== null);
      const averageGrade = submissionsWithGrades.length > 0 
        ? submissionsWithGrades.reduce((sum, s) => sum + (s.finalGrade || 0), 0) / submissionsWithGrades.length
        : null;

      const onTimeSubmissions = courseSubmissions.filter(s => !s.late && s.turnedInAt).length;
      const onTimeSubmissionRate = courseSubmissions.length > 0 
        ? (onTimeSubmissions / courseSubmissions.length) * 100 
        : 0;

      // Get last activity
      const lastActivity = courseSubmissions
        .map(s => s.turnedInAt || s.updatedAt)
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0];

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (completionRate < 50 || (averageGrade !== null && averageGrade < 60) || missedAssignments > 2) {
        riskLevel = 'high';
      } else if (completionRate < 75 || (averageGrade !== null && averageGrade < 80) || lateAssignments > 1) {
        riskLevel = 'medium';
      }

      return {
        studentId,
        courseId,
        courseName: course.name,
        completionRate,
        averageGrade,
        onTimeSubmissionRate,
        totalAssignments,
        completedAssignments,
        lateAssignments,
        missedAssignments,
        lastActivity,
        riskLevel
      };
    } catch (error) {
      console.error('Failed to get student course progress:', error);
      return null;
    }
  }

  async getStudentOverallProgress(studentId: string): Promise<{
    overallMetrics: ProgressMetrics;
    courseProgress: StudentCourseProgress[];
  }> {
    try {
      // Get all courses for this student
      const studentEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.userId, studentId),
        with: {
          course: {
            columns: { id: true, name: true }
          }
        }
      });

      const courseProgress: StudentCourseProgress[] = [];
      for (const enrollment of studentEnrollments) {
        const progress = await this.getStudentCourseProgress(studentId, enrollment.courseId);
        if (progress) {
          courseProgress.push(progress);
        }
      }

      // Calculate overall metrics
      const totalAssignments = courseProgress.reduce((sum, p) => sum + p.totalAssignments, 0);
      const completedAssignments = courseProgress.reduce((sum, p) => sum + p.completedAssignments, 0);
      const lateAssignments = courseProgress.reduce((sum, p) => sum + p.lateAssignments, 0);
      const missedAssignments = courseProgress.reduce((sum, p) => sum + p.missedAssignments, 0);

      const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
      
      const gradesData = courseProgress.filter(p => p.averageGrade !== null);
      const averageGrade = gradesData.length > 0
        ? gradesData.reduce((sum, p) => sum + (p.averageGrade || 0), 0) / gradesData.length
        : null;

      const onTimeSubmissionRate = courseProgress.length > 0
        ? courseProgress.reduce((sum, p) => sum + p.onTimeSubmissionRate, 0) / courseProgress.length
        : 0;

      const lastActivity = courseProgress
        .map(p => p.lastActivity)
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0];

      return {
        overallMetrics: {
          completionRate,
          averageGrade,
          onTimeSubmissionRate,
          totalAssignments,
          completedAssignments,
          lateAssignments,
          missedAssignments,
          lastActivity
        },
        courseProgress
      };
    } catch (error) {
      console.error('Failed to get student overall progress:', error);
      return {
        overallMetrics: {
          completionRate: 0,
          averageGrade: null,
          onTimeSubmissionRate: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          lateAssignments: 0,
          missedAssignments: 0
        },
        courseProgress: []
      };
    }
  }

  async getCourseMetrics(courseId: string): Promise<CourseMetrics | null> {
    try {
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        columns: { id: true, name: true }
      });

      if (!course) return null;

      // Get all students in the course
      const courseEnrollments = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.roleInCourse, 'STUDENT')
        ),
        columns: { userId: true }
      });

      const totalStudents = courseEnrollments.length;
      if (totalStudents === 0) {
        return {
          courseId,
          courseName: course.name,
          totalStudents: 0,
          activeStudents: 0,
          averageCompletion: 0,
          averageGrade: null,
          studentsAtRisk: 0
        };
      }

      // Calculate metrics for each student
      const studentMetrics = [];
      for (const enrollment of courseEnrollments) {
        const progress = await this.getStudentCourseProgress(enrollment.userId, courseId);
        if (progress) {
          studentMetrics.push(progress);
        }
      }

      const activeStudents = studentMetrics.filter(m => m.lastActivity && 
        m.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Active in last 7 days
      ).length;

      const averageCompletion = studentMetrics.length > 0
        ? studentMetrics.reduce((sum, m) => sum + m.completionRate, 0) / studentMetrics.length
        : 0;

      const studentsWithGrades = studentMetrics.filter(m => m.averageGrade !== null);
      const averageGrade = studentsWithGrades.length > 0
        ? studentsWithGrades.reduce((sum, m) => sum + (m.averageGrade || 0), 0) / studentsWithGrades.length
        : null;

      const studentsAtRisk = studentMetrics.filter(m => m.riskLevel === 'high').length;

      return {
        courseId,
        courseName: course.name,
        totalStudents,
        activeStudents,
        averageCompletion,
        averageGrade,
        studentsAtRisk
      };
    } catch (error) {
      console.error('Failed to get course metrics:', error);
      return null;
    }
  }

  async getTeacherCourseOverview(teacherId: string): Promise<{
    courses: CourseMetrics[];
    totalStudents: number;
    totalAssignments: number;
    pendingSubmissions: number;
  }> {
    try {
      // Get courses where this user is a teacher
      const teacherCourses = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.userId, teacherId),
          eq(enrollments.roleInCourse, 'TEACHER')
        ),
        with: {
          course: {
            columns: { id: true, name: true }
          }
        }
      });

      const courseMetrics: CourseMetrics[] = [];
      let totalStudents = 0;
      let totalAssignments = 0;
      let pendingSubmissions = 0;

      for (const enrollment of teacherCourses) {
        const metrics = await this.getCourseMetrics(enrollment.courseId);
        if (metrics) {
          courseMetrics.push(metrics);
          totalStudents += metrics.totalStudents;
        }

        // Count assignments and pending submissions
        const courseCoursework = await db.query.coursework.findMany({
          where: eq(coursework.courseId, enrollment.courseId),
          columns: { id: true }
        });
        totalAssignments += courseCoursework.length;

        // Count pending submissions (submitted but not graded)
        const pendingCount = await db
          .select({ count: count() })
          .from(submissions)
          .leftJoin(coursework, eq(submissions.courseworkId, coursework.id))
          .where(
            and(
              eq(coursework.courseId, enrollment.courseId),
              eq(submissions.state, 'TURNED_IN'),
              sql`${submissions.assignedGrade} IS NULL`
            )
          );

        pendingSubmissions += pendingCount[0]?.count || 0;
      }

      return {
        courses: courseMetrics,
        totalStudents,
        totalAssignments,
        pendingSubmissions
      };
    } catch (error) {
      console.error('Failed to get teacher course overview:', error);
      return {
        courses: [],
        totalStudents: 0,
        totalAssignments: 0,
        pendingSubmissions: 0
      };
    }
  }
}

export const progressService = new ProgressService();
