import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { courses, enrollments, users, submissions, coursework, studentProgress } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { Course, User } from "@/types";

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  progress: number;
  lastActive: Date;
  assignmentsCompleted: number;
  totalAssignments: number;
  averageGrade: number;
}

interface ClassWithDetails extends Course {
  studentInfo: StudentInfo[];
  recentActivity: {
    studentId: string;
    studentName: string;
    action: string;
    timestamp: Date;
  }[];
  stats: {
    totalStudents: number;
    activeStudents: number;
    averageProgress: number;
    pendingSubmissions: number;
  };
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
    
    // Only teachers and coordinators can access class data
    if (userRole === "student") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const classes = await getClassData(session.user.id, userRole);

    return NextResponse.json({ data: classes });
  } catch (error) {
    console.error("Classes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getClassData(userId: string, userRole: string): Promise<ClassWithDetails[]> {
  try {
    // Get courses based on user role
    let coursesQuery;
    
    if (userRole === "teacher") {
      // First get teacher's course IDs
      const teacherCourses = await db.query.enrollments.findMany({
        where: and(
          eq(enrollments.userId, userId),
          eq(enrollments.roleInCourse, "TEACHER")
        ),
        columns: { courseId: true }
      });
      const teacherCourseIds = teacherCourses.map(e => e.courseId);
      
      // Then get courses with details
      if (teacherCourseIds.length === 0) {
        coursesQuery = Promise.resolve([]);
      } else {
        coursesQuery = db.query.courses.findMany({
          with: {
            enrollments: {
              with: {
                user: true
              }
            },
            coursework: {
              with: {
                submissions: {
                  with: {
                    student: true
                  }
                }
              }
            }
          }
        }).then(allCourses => 
          allCourses.filter(course => teacherCourseIds.includes(course.id))
        );
      }
    } else {
      // Coordinators see all courses
      coursesQuery = db.query.courses.findMany({
        with: {
          enrollments: {
            with: {
              user: true
            }
          },
          coursework: {
            with: {
              submissions: {
                with: {
                  student: true
                }
              }
            }
          }
        }
      });
    }

    const coursesData = await coursesQuery;

    // Transform to ClassWithDetails format
    const classesWithDetails: ClassWithDetails[] = await Promise.all(
      coursesData.map(async (course: any) => {
        const studentEnrollments = course.enrollments?.filter((e: any) => e.roleInCourse === "STUDENT") || [];
        const students = studentEnrollments.map((e: any) => e.user);
        
        // Get student progress data
        const progressData = await db.query.studentProgress.findMany({
          where: eq(studentProgress.courseId, course.id)
        });
        
        // Calculate student info
        const studentInfo: StudentInfo[] = await Promise.all(
          students.map(async (student: any) => {
            const progress = progressData.find(p => p.studentId === student.id);
            const studentSubmissions = course.coursework?.flatMap((cw: any) => 
              cw.submissions?.filter((s: any) => s.studentId === student.id) || []
            ) || [];
            
            const totalAssignments = course.coursework?.length || 0;
            const completedAssignments = studentSubmissions.filter((s: any) => s.state === "TURNED_IN").length;
            const gradedSubmissions = studentSubmissions.filter((s: any) => s.assignedGrade !== null);
            const averageGrade = gradedSubmissions.length > 0 
              ? Math.round(gradedSubmissions.reduce((acc: number, s: any) => acc + (s.assignedGrade || 0), 0) / gradedSubmissions.length)
              : 0;

            return {
              id: student.id,
              name: student.name,
              email: student.email,
              progress: progress?.completionRate || Math.round((completedAssignments / Math.max(totalAssignments, 1)) * 100),
              lastActive: progress?.lastActivity || new Date(),
              assignmentsCompleted: completedAssignments,
              totalAssignments,
              averageGrade
            };
          })
        );

        // Get recent activity (latest submissions)
        const recentSubmissions = course.coursework?.flatMap((cw: any) =>
          cw.submissions?.map((s: any) => ({
            studentId: s.studentId,
            studentName: s.student.name,
            action: `Submitted ${cw.title}`,
            timestamp: s.turnedInAt || s.updatedAt
          })) || []
        ) || [];
        
        const recentActivity = recentSubmissions
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

        // Calculate stats
        const totalStudents = students.length;
        const activeStudents = studentInfo.filter(s => 
          new Date().getTime() - new Date(s.lastActive).getTime() < 7 * 24 * 60 * 60 * 1000
        ).length;
        const averageProgress = totalStudents > 0 
          ? Math.round(studentInfo.reduce((acc, s) => acc + s.progress, 0) / totalStudents)
          : 0;
        const pendingSubmissions = course.coursework?.flatMap((cw: any) => 
          cw.submissions?.filter((s: any) => s.state === "TURNED_IN") || []
        ).length || 0;

        return {
          id: course.id,
          googleClassroomId: course.externalId,
          name: course.name,
          description: course.description || "",
          teacherId: course.ownerGoogleId || "",
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          students: [],
          assignments: [],
          studentInfo,
          recentActivity,
          stats: {
            totalStudents,
            activeStudents,
            averageProgress,
            pendingSubmissions
          }
        };
      })
    );

    return classesWithDetails;
  } catch (error) {
    console.error("Error fetching class data:", error);
    throw error;
  }
}
