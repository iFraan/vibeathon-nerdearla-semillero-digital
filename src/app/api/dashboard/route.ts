import { NextRequest, NextResponse } from "next/server";
import { progressService } from "@/lib/services/progress";
import { db } from "@/lib/database";
import { enrollments, submissions, coursework } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    
    let dashboardData;

    switch (userRole) {
      case "student":
        dashboardData = await getStudentDashboardData(userId);
        break;
      case "teacher":
        dashboardData = await getTeacherDashboardData(userId);
        break;
      case "coordinator":
        dashboardData = await getCoordinatorDashboardData(userId);
        break;
      default:
        return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Dashboard data fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" }, 
      { status: 500 }
    );
  }
}

async function getStudentDashboardData(userId: string) {
  const progress = await progressService.getStudentOverallProgress(userId);
  
  // Get upcoming deadlines
  const upcomingDeadlines = await db.query.coursework.findMany({
    where: and(
      sql`${coursework.dueDate} > NOW()`,
      sql`${coursework.dueDate} < NOW() + INTERVAL '14 days'` // Next 2 weeks
    ),
    with: {
      course: {
        columns: { name: true }
      },
      submissions: {
        where: eq(submissions.studentId, userId),
        columns: { state: true, late: true, turnedInAt: true }
      }
    },
    orderBy: [coursework.dueDate],
    limit: 10
  });

  // Get recent activity (submissions and grades)
  const recentSubmissions = await db.query.submissions.findMany({
    where: eq(submissions.studentId, userId),
    with: {
      coursework: {
        with: {
          course: {
            columns: { name: true }
          }
        }
      }
    },
    orderBy: [desc(submissions.updatedAt)],
    limit: 10
  });

  return {
    overallMetrics: progress.overallMetrics,
    courseProgress: progress.courseProgress,
    upcomingDeadlines: upcomingDeadlines.map(coursework => ({
      id: coursework.id,
      title: coursework.title,
      courseName: coursework.course?.name || "Unknown Course",
      dueDate: coursework.dueDate,
      isSubmitted: coursework.submissions.length > 0 && coursework.submissions[0].state === "TURNED_IN",
      isLate: coursework.submissions.length > 0 && coursework.submissions[0].late
    })),
    recentActivity: recentSubmissions.map(submission => ({
      id: submission.id,
      type: submission.assignedGrade ? "grade" : "submission",
      title: submission.coursework?.title || "Unknown Assignment",
      courseName: submission.coursework?.course?.name || "Unknown Course",
      date: submission.updatedAt,
      grade: submission.assignedGrade || submission.finalGrade
    }))
  };
}

async function getTeacherDashboardData(userId: string) {
  const overview = await progressService.getTeacherCourseOverview(userId);
  
  // Get pending submissions for teacher's courses
  const teacherCourses = await db.query.enrollments.findMany({
    where: and(
      eq(enrollments.userId, userId),
      eq(enrollments.roleInCourse, "TEACHER")
    ),
    columns: { courseId: true }
  });

  const courseIds = teacherCourses.map(e => e.courseId);
  
  const pendingSubmissions = await db.query.submissions.findMany({
    where: and(
      eq(submissions.state, "TURNED_IN"),
      sql`${submissions.assignedGrade} IS NULL`
    ),
    with: {
      student: {
        columns: { name: true, email: true }
      },
      coursework: {
        where: sql`${coursework.courseId} = ANY(${courseIds})`,
        with: {
          course: {
            columns: { name: true }
          }
        }
      }
    },
    orderBy: [desc(submissions.turnedInAt)],
    limit: 20
  });

  // Mock data for students at risk (would be calculated from progress service)
  const studentsAtRisk = await db.query.enrollments.findMany({
    where: and(
      sql`${enrollments.courseId} = ANY(${courseIds})`,
      eq(enrollments.roleInCourse, "STUDENT")
    ),
    with: {
      user: {
        columns: { id: true, name: true, email: true }
      },
      course: {
        columns: { name: true }
      }
    },
    limit: 10
  });

  const recentActivity = pendingSubmissions.slice(0, 10).map(submission => ({
    id: submission.id,
    type: "submission",
    studentName: submission.student?.name || "Unknown Student",
    courseName: submission.coursework?.course?.name || "Unknown Course",
    description: `Submitted ${submission.coursework?.title}`,
    date: submission.turnedInAt || submission.updatedAt
  }));

  return {
    overview,
    pendingSubmissions: pendingSubmissions.map(submission => ({
      id: submission.id,
      studentName: submission.student?.name || "Unknown Student",
      studentEmail: submission.student?.email || "",
      courseName: submission.coursework?.course?.name || "Unknown Course",
      assignmentTitle: submission.coursework?.title || "Unknown Assignment",
      submittedAt: submission.turnedInAt || submission.updatedAt,
      isLate: submission.late
    })),
    studentsAtRisk: studentsAtRisk.slice(0, 5).map(enrollment => ({
      id: enrollment.user?.id || "",
      name: enrollment.user?.name || "Unknown Student",
      email: enrollment.user?.email || "",
      courseName: enrollment.course?.name || "Unknown Course",
      riskLevel: "medium" as const, // Would be calculated
      completionRate: 65, // Would be calculated
      averageGrade: 72, // Would be calculated
      missedAssignments: 2 // Would be calculated
    })),
    recentActivity
  };
}

async function getCoordinatorDashboardData(userId: string) {
  // Get system-wide metrics
  const totalStudents = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.roleInCourse, "STUDENT"));
  const totalTeachers = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.roleInCourse, "TEACHER"));
  const totalCourses = await db.select({ count: sql<number>`count(*)` }).from(db.query.courses);
  
  // Mock data for now - in real implementation, these would be calculated
  const systemMetrics = {
    totalStudents: totalStudents[0]?.count || 0,
    totalTeachers: totalTeachers[0]?.count || 0,
    totalCourses: totalCourses[0]?.count || 0,
    activeUsers: Math.floor((totalStudents[0]?.count || 0) * 0.75),
    averageCompletion: 73,
    averageGrade: 78,
    studentsAtRisk: Math.floor((totalStudents[0]?.count || 0) * 0.15)
  };

  // Get all courses with metrics
  const courseMetrics = await db.query.courses.findMany({
    with: {
      enrollments: {
        where: eq(enrollments.roleInCourse, "TEACHER"),
        with: {
          user: {
            columns: { name: true }
          }
        }
      }
    },
    limit: 50
  });

  return {
    systemMetrics,
    courseMetrics: courseMetrics.map(course => ({
      courseId: course.id,
      courseName: course.name,
      teacherName: course.enrollments[0]?.user?.name || "Unassigned",
      totalStudents: Math.floor(Math.random() * 25) + 10, // Mock data
      activeStudents: Math.floor(Math.random() * 20) + 8, // Mock data
      averageCompletion: Math.floor(Math.random() * 40) + 60, // Mock data
      averageGrade: Math.floor(Math.random() * 30) + 70, // Mock data
      studentsAtRisk: Math.floor(Math.random() * 3) // Mock data
    })),
    teacherPerformance: [], // Would be populated with actual data
    riskAnalysis: [], // Would be populated with actual data
    gradeDistribution: [
      { range: "90-100", count: 45 },
      { range: "80-89", count: 67 },
      { range: "70-79", count: 52 },
      { range: "60-69", count: 28 },
      { range: "Below 60", count: 15 }
    ], // Mock data
    engagementTrends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      activeStudents: Math.floor(Math.random() * 50) + 100,
      submissions: Math.floor(Math.random() * 30) + 20,
      logins: Math.floor(Math.random() * 80) + 120
    }))
  };
}
