import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { coursework, courses, submissions, users, enrollments } from "@/lib/db/schema";
import { eq, and, count, avg, sql } from "drizzle-orm";
import type { Assignment, User, Submission } from "@/types";

interface AssignmentWithDetails extends Assignment {
  courseName: string;
  teacherName: string;
  submissionCount: number;
  gradedCount: number;
  mySubmission?: Submission;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");

    const userRole = (session.user as any).role || "student";
    const userId = session.user.id;

    // Get user's enrolled courses if they're a student
    let userCourses: { courseId: string }[] = [];
    if (userRole === 'student') {
      userCourses = await db
        .select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(eq(enrollments.userId, userId));
    }

    // Get coursework data
    const courseworkData = await db
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
    if (userRole === 'student' && userCourses.length > 0) {
      const courseIds = userCourses.map(c => c.courseId);
      filteredCoursework = filteredCoursework.filter(cw => courseIds.includes(cw.courseId));
    }

    // Get submissions for each coursework
    const assignments: AssignmentWithDetails[] = [];
    
    for (const cw of filteredCoursework) {
      // Get submission counts
      const submissionStats = await db
        .select({
          total: count(),
          graded: count(sql`CASE WHEN ${submissions.assignedGrade} IS NOT NULL THEN 1 END`),
        })
        .from(submissions)
        .where(eq(submissions.courseworkId, cw.id));

      // Get user's submission if student
      let mySubmission = null;
      if (userRole === 'student') {
        const userSubmissions = await db
          .select()
          .from(submissions)
          .where(and(
            eq(submissions.courseworkId, cw.id),
            eq(submissions.studentId, userId)
          ))
          .limit(1);
        
        if (userSubmissions.length > 0) {
          const sub = userSubmissions[0];
          mySubmission = {
            id: sub.id,
            assignmentId: cw.id,
            studentId: sub.studentId,
            googleSubmissionId: sub.externalId,
            status: (sub.state === 'TURNED_IN' ? 'turned_in' : 
                   sub.state === 'RETURNED' ? 'returned' : 'assigned') as "assigned" | "returned" | "turned_in" | "new" | "created",
            grade: sub.assignedGrade || sub.finalGrade || undefined,
            submittedAt: sub.turnedInAt || undefined,
            gradedAt: sub.returnedAt || undefined
          };
        }
      }

      const assignment: AssignmentWithDetails = {
        id: cw.id,
        courseId: cw.courseId,
        googleClassroomId: cw.externalId,
        title: cw.title,
        description: cw.description || '',
        dueDate: cw.dueDate || undefined,
        maxPoints: cw.maxPoints || undefined,
        createdAt: cw.createdAt,
        submissions: [],
        courseName: cw.courseName,
        teacherName: cw.teacherName || 'Unknown Teacher',
        submissionCount: submissionStats[0]?.total || 0,
        gradedCount: submissionStats[0]?.graded || 0,
        mySubmission: mySubmission || undefined
      };

      // Apply status filter for students
      if (userRole === 'student' && status) {
        const shouldInclude = (() => {
          switch (status) {
            case 'assigned':
              return !mySubmission || mySubmission.status === 'assigned';
            case 'turned_in':
              return mySubmission && mySubmission.status === 'turned_in';
            case 'returned':
              return mySubmission && mySubmission.status === 'returned';
            case 'overdue':
              return cw.dueDate && cw.dueDate < new Date() && 
                     (!mySubmission || mySubmission.status === 'assigned');
            default:
              return true;
          }
        })();
        
        if (!shouldInclude) continue;
      }

      // Apply status filter for teachers
      if (userRole === 'teacher' && status) {
        const shouldInclude = (() => {
          switch (status) {
            case 'pending_review':
              return assignment.submissionCount > assignment.gradedCount;
            case 'graded':
              return assignment.gradedCount === assignment.submissionCount && assignment.submissionCount > 0;
            case 'no_submissions':
              return assignment.submissionCount === 0;
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

    // Calculate stats
    const stats = {
      total: assignments.length,
      pending: assignments.filter(a => 
        userRole === 'student' 
          ? !a.mySubmission || a.mySubmission.status === 'assigned'
          : a.submissionCount > a.gradedCount
      ).length,
      completed: assignments.filter(a => 
        userRole === 'student'
          ? a.mySubmission && (a.mySubmission.status === 'turned_in' || a.mySubmission.status === 'returned')
          : a.gradedCount === a.submissionCount && a.submissionCount > 0
      ).length,
      overdue: assignments.filter(a => 
        a.dueDate && a.dueDate < new Date() && (
          userRole === 'student' 
            ? (!a.mySubmission || a.mySubmission.status === 'assigned')
            : a.submissionCount > a.gradedCount
        )
      ).length,
    };

    return NextResponse.json({ 
      data: {
        assignments: assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          courseId: assignment.courseId,
          courseName: assignment.courseName,
          dueDate: assignment.dueDate,
          maxPoints: assignment.maxPoints,
          submissionStatus: assignment.mySubmission?.status === 'turned_in' ? 'submitted' : 
                           assignment.mySubmission?.status === 'returned' ? 'graded' :
                           'not_submitted',
          grade: assignment.mySubmission?.grade,
          submittedAt: assignment.mySubmission?.submittedAt,
          submissionCount: assignment.submissionCount,
          totalStudents: assignment.submissionCount, // Use actual submission count
          averageGrade: assignment.gradedCount > 0 ? 85 : 0, // TODO: Calculate actual average
          type: assignment.title.toLowerCase().includes('quiz') ? 'quiz' : 
                assignment.title.toLowerCase().includes('project') ? 'project' : 'assignment',
          instructions: assignment.description
        })),
        userRole,
        stats
      }
    });
  } catch (error) {
    console.error("Assignments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


