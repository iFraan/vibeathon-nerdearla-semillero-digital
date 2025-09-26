import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "../trpc";
import { coursework, courses, submissions, users, enrollments } from "@/lib/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import type { Assignment, Submission } from "@/types";

interface AssignmentWithDetails extends Assignment {
  courseName: string;
  teacherName: string;
  submissionCount: number;
  gradedCount: number;
  mySubmission?: Submission;
}

export const assignmentsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          courseId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user) throw new Error("Authentication required");

      const userRole = (user as any).role || "student";
      const userId = user.id;
      const status = input?.status;
      const courseId = input?.courseId;

      // Get user's enrolled courses if they're a student
      let userCourses: { courseId: string }[] = [];
      if (userRole === "student") {
        userCourses = await ctx.db
          .select({ courseId: enrollments.courseId })
          .from(enrollments)
          .where(eq(enrollments.userId, userId));
      }

      // Get coursework data
      const courseworkData = await ctx.db
        .select({
          id: coursework.id,
          externalId: coursework.externalId,
          title: coursework.title,
          description: coursework.description,
          maxPoints: coursework.maxPoints,
          dueDate: coursework.dueDate,
          courseId: coursework.courseId,
          courseName: courses.name,
          teacherName: users.name,
          createdAt: coursework.createdAt,
        })
        .from(coursework)
        .innerJoin(courses, eq(coursework.courseId, courses.id))
        .leftJoin(users, eq(courses.ownerGoogleId, users.googleId));

      // Filter coursework based on role and params
      let filteredCoursework = courseworkData;

      // Filter by course if specified
      if (courseId) {
        filteredCoursework = filteredCoursework.filter(cw => cw.courseId === courseId);
      }

      // Filter by user's enrolled courses if student
      if (userRole === "student" && userCourses.length > 0) {
        const courseIds = userCourses.map(c => c.courseId);
        filteredCoursework = filteredCoursework.filter(cw => courseIds.includes(cw.courseId));
      }

      // Get submissions for each coursework
      const assignments: AssignmentWithDetails[] = [];

      for (const cw of filteredCoursework) {
        // Get submission counts
        const submissionStats = await ctx.db
          .select({
            total: count(),
            graded: count(sql`CASE WHEN ${submissions.assignedGrade} IS NOT NULL THEN 1 END`),
          })
          .from(submissions)
          .where(eq(submissions.courseworkId, cw.id));

        // Get user's submission if student
        let mySubmission = null;
        if (userRole === "student") {
          const userSubmissions = await ctx.db
            .select()
            .from(submissions)
            .where(
              and(
                eq(submissions.courseworkId, cw.id),
                eq(submissions.studentId, userId)
              )
            )
            .limit(1);

          if (userSubmissions.length > 0) {
            const sub = userSubmissions[0];
            mySubmission = {
              id: sub.id,
              assignmentId: cw.id,
              studentId: sub.studentId,
              googleSubmissionId: sub.externalId,
              status: (
                sub.state === "TURNED_IN"
                  ? "turned_in"
                  : sub.state === "RETURNED"
                  ? "returned"
                  : "assigned"
              ) as "assigned" | "returned" | "turned_in" | "new" | "created",
              grade: sub.assignedGrade || sub.finalGrade || undefined,
              submittedAt: sub.turnedInAt || undefined,
              gradedAt: sub.returnedAt || undefined,
            };
          }
        }

        const assignment: AssignmentWithDetails = {
          id: cw.id,
          courseId: cw.courseId,
          googleClassroomId: cw.externalId,
          title: cw.title,
          description: cw.description || "",
          dueDate: cw.dueDate || undefined,
          maxPoints: cw.maxPoints || undefined,
          createdAt: cw.createdAt,
          submissions: [],
          courseName: cw.courseName,
          teacherName: cw.teacherName || "Unknown Teacher",
          submissionCount: submissionStats[0]?.total || 0,
          gradedCount: submissionStats[0]?.graded || 0,
          mySubmission: mySubmission || undefined,
        };

        // Apply status filter for students
        if (userRole === "student" && status) {
          const shouldInclude = (() => {
            switch (status) {
              case "assigned":
                return !mySubmission || mySubmission.status === "assigned";
              case "turned_in":
                return mySubmission && mySubmission.status === "turned_in";
              case "returned":
              case "graded":
                return mySubmission && mySubmission.status === "returned";
              case "completed":
                return (
                  mySubmission &&
                  (mySubmission.status === "turned_in" || mySubmission.status === "returned")
                );
              case "late":
              case "missed":
              case "overdue":
                return (
                  cw.dueDate &&
                  cw.dueDate < new Date() &&
                  (!mySubmission || mySubmission.status === "assigned")
                );
              case "pending":
                return !mySubmission || mySubmission.status === "assigned";
              case "all":
                return true;
              default:
                return true;
            }
          })();

          if (!shouldInclude) continue;
        }

        // Apply status filter for teachers
        if (userRole === "teacher" && status) {
          const shouldInclude = (() => {
            switch (status) {
              case "pending_review":
                return assignment.submissionCount > assignment.gradedCount;
              case "graded":
                return (
                  assignment.gradedCount === assignment.submissionCount &&
                  assignment.submissionCount > 0
                );
              case "no_submissions":
                return assignment.submissionCount === 0;
              case "all":
                return true;
              default:
                return true;
            }
          })();

          if (!shouldInclude) continue;
        }

        assignments.push(assignment);
      }

      // Sort by due date
      assignments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

      return assignments;
    }),
});
