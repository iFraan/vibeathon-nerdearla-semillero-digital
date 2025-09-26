import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { submissions, coursework, courses, users, enrollments } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { Submission, User } from "@/types";

interface SubmissionWithDetails extends Submission {
  assignmentTitle: string;
  courseName: string;
  studentName: string;
  studentEmail: string;
  submissionUrl?: string;
  attachments?: string[];
  teacherComments?: string;
  rubricScore?: {
    criteria: string;
    points: number;
    maxPoints: number;
    comment?: string;
  }[];
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

    const userRole = (session.user as any).role || "student";
    
    // Only teachers and coordinators can access submissions
    if (userRole === "student") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");
    const assignmentId = searchParams.get("assignmentId");

    const submissionsData = await getSubmissions(session.user.id, userRole, status, courseId, assignmentId);

    return NextResponse.json({ data: submissionsData });
  } catch (error) {
    console.error("Submissions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const userRole = (session.user as any).role || "student";
    
    if (userRole !== "teacher" && userRole !== "coordinator") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { submissionId, grade, comment, status } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    // Update submission in database
    const updatedSubmission = await db
      .update(submissions)
      .set({
        assignedGrade: grade,
        finalGrade: grade,
        state: status || "RETURNED",
        returnedAt: status === "returned" ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(submissions.id, submissionId))
      .returning();

    if (updatedSubmission.length === 0) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
        message: "Submission updated successfully",
        submission: updatedSubmission[0]
      }
    });
  } catch (error) {
    console.error("Submission update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getSubmissions(
  userId: string,
  userRole: string,
  statusFilter?: string | null,
  courseFilter?: string | null,
  assignmentFilter?: string | null
): Promise<SubmissionWithDetails[]> {
  try {
    // Build conditions array
    const conditions: any[] = [];
    
    // Role-based filtering
    if (userRole === "student") {
      conditions.push(eq(submissions.studentId, userId));
    }
    
    // Status filtering
    if (statusFilter) {
      if (statusFilter === "pending") {
        conditions.push(eq(submissions.state, "TURNED_IN"));
      } else if (statusFilter === "graded") {
        conditions.push(eq(submissions.state, "RETURNED"));
      } else {
        conditions.push(eq(submissions.state, statusFilter.toUpperCase()));
      }
    }

    if (courseFilter) {
      conditions.push(eq(courses.id, courseFilter));
    }

    if (assignmentFilter) {
      conditions.push(eq(coursework.id, assignmentFilter));
    }

    // Use query builder approach
    const results = await db.query.submissions.findMany({
      with: {
        coursework: {
          with: {
            course: true
          }
        },
        student: true
      },
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(submissions.turnedInAt)]
    });

    // Filter results for teachers manually (since we need to check enrollments)
    let filteredResults = results;
    if (userRole === "teacher") {
      // Get teacher's course IDs
      const teacherCourses = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.userId, userId),
          eq(enrollments.roleInCourse, "TEACHER")
        ),
        columns: { courseId: true }
      });
      const teacherCourseIds = teacherCourses.map(e => e.courseId);
      
      filteredResults = results.filter(row => 
        teacherCourseIds.includes(row.coursework.course.id)
      );
    }

    // Transform results to match SubmissionWithDetails interface
    return filteredResults.map(row => ({
      id: row.id,
      assignmentId: row.courseworkId,
      studentId: row.studentId,
      googleSubmissionId: row.externalId,
      status: (row.state?.toLowerCase() === "turned_in" ? "turned_in" : 
               row.state?.toLowerCase() === "returned" ? "returned" : 
               row.state?.toLowerCase() === "new" ? "new" :
               row.state?.toLowerCase() === "assigned" ? "assigned" :
               row.state?.toLowerCase() === "created" ? "created" : "new") as "assigned" | "returned" | "turned_in" | "new" | "created",
      grade: row.assignedGrade ?? undefined,
      submittedAt: row.turnedInAt ?? undefined,
      gradedAt: row.returnedAt ?? undefined,
      assignmentTitle: row.coursework.title,
      courseName: row.coursework.course.name,
      studentName: row.student.name,
      studentEmail: row.student.email,
      // Note: These fields would need additional queries or schema changes to populate
      submissionUrl: undefined, 
      attachments: [],
      teacherComments: undefined,
      rubricScore: undefined
    }));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }
}
