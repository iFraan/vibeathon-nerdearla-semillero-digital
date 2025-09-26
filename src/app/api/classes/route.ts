import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

    const classes = generateMockClassData(userRole);

    return NextResponse.json({ data: classes });
  } catch (error) {
    console.error("Classes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMockClassData(role: string): ClassWithDetails[] {
  const baseDate = new Date();
  
  const teacherClasses: ClassWithDetails[] = [
    {
      id: "course-1",
      googleClassroomId: "gc-course-1",
      name: "Web Development Fundamentals",
      description: "Learn HTML, CSS, JavaScript and modern web development practices",
      teacherId: "teacher-1",
      createdAt: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      students: [],
      assignments: [],
      studentInfo: [
        {
          id: "student-1",
          name: "María González",
          email: "maria.gonzalez@email.com",
          progress: 95,
          lastActive: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
          assignmentsCompleted: 8,
          totalAssignments: 8,
          averageGrade: 92
        },
        {
          id: "student-2",
          name: "Carlos Mendoza",
          email: "carlos.mendoza@email.com",
          progress: 87,
          lastActive: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000),
          assignmentsCompleted: 7,
          totalAssignments: 8,
          averageGrade: 88
        },
        {
          id: "student-3",
          name: "Ana Pérez",
          email: "ana.perez@email.com",
          progress: 78,
          lastActive: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000),
          assignmentsCompleted: 6,
          totalAssignments: 8,
          averageGrade: 85
        },
        {
          id: "student-4",
          name: "Diego Silva",
          email: "diego.silva@email.com",
          progress: 65,
          lastActive: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
          assignmentsCompleted: 5,
          totalAssignments: 8,
          averageGrade: 75
        },
        {
          id: "student-5",
          name: "Laura Torres",
          email: "laura.torres@email.com",
          progress: 92,
          lastActive: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000),
          assignmentsCompleted: 8,
          totalAssignments: 8,
          averageGrade: 90
        }
      ],
      recentActivity: [
        {
          studentId: "student-1",
          studentName: "María González",
          action: "Submitted JavaScript Functions Exercise",
          timestamp: new Date(baseDate.getTime() - 30 * 60 * 1000)
        },
        {
          studentId: "student-5",
          studentName: "Laura Torres",
          action: "Submitted JavaScript Functions Exercise",
          timestamp: new Date(baseDate.getTime() - 45 * 60 * 1000)
        },
        {
          studentId: "student-2",
          studentName: "Carlos Mendoza",
          action: "Viewed HTML/CSS feedback",
          timestamp: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000)
        }
      ],
      stats: {
        totalStudents: 32,
        activeStudents: 28,
        averageProgress: 85,
        pendingSubmissions: 12
      }
    },
    {
      id: "course-2",
      googleClassroomId: "gc-course-2",
      name: "Advanced React Development",
      description: "Master React hooks, state management, and modern React patterns",
      teacherId: "teacher-1",
      createdAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
      students: [],
      assignments: [],
      studentInfo: [
        {
          id: "student-6",
          name: "Roberto Kim",
          email: "roberto.kim@email.com",
          progress: 88,
          lastActive: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000),
          assignmentsCompleted: 4,
          totalAssignments: 5,
          averageGrade: 91
        },
        {
          id: "student-7",
          name: "Sofia Ramírez",
          email: "sofia.ramirez@email.com",
          progress: 76,
          lastActive: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000),
          assignmentsCompleted: 3,
          totalAssignments: 5,
          averageGrade: 82
        },
        {
          id: "student-8",
          name: "Miguel Santos",
          email: "miguel.santos@email.com",
          progress: 94,
          lastActive: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
          assignmentsCompleted: 5,
          totalAssignments: 5,
          averageGrade: 95
        }
      ],
      recentActivity: [
        {
          studentId: "student-8",
          studentName: "Miguel Santos",
          action: "Started React Components Project",
          timestamp: new Date(baseDate.getTime() - 45 * 60 * 1000)
        },
        {
          studentId: "student-6",
          studentName: "Roberto Kim",
          action: "Submitted Hooks Workshop",
          timestamp: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000)
        }
      ],
      stats: {
        totalStudents: 18,
        activeStudents: 16,
        averageProgress: 82,
        pendingSubmissions: 7
      }
    }
  ];

  // Coordinators see all classes
  if (role === "coordinator") {
    const additionalClasses: ClassWithDetails[] = [
      {
        id: "course-3",
        googleClassroomId: "gc-course-3",
        name: "Database Design & SQL",
        description: "Learn database design principles and SQL query optimization",
        teacherId: "teacher-2",
        createdAt: new Date(baseDate.getTime() - 75 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 3 * 60 * 60 * 1000),
        students: [],
        assignments: [],
        studentInfo: [
          {
            id: "student-9",
            name: "Carmen Vega",
            email: "carmen.vega@email.com",
            progress: 91,
            lastActive: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
            assignmentsCompleted: 6,
            totalAssignments: 6,
            averageGrade: 89
          },
          {
            id: "student-10",
            name: "Andrés Luna",
            email: "andres.luna@email.com",
            progress: 73,
            lastActive: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000),
            assignmentsCompleted: 4,
            totalAssignments: 6,
            averageGrade: 78
          }
        ],
        recentActivity: [
          {
            studentId: "student-9",
            studentName: "Carmen Vega",
            action: "Submitted Normalization Exercise",
            timestamp: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000)
          }
        ],
        stats: {
          totalStudents: 25,
          activeStudents: 22,
          averageProgress: 79,
          pendingSubmissions: 8
        }
      },
      {
        id: "course-4",
        googleClassroomId: "gc-course-4",
        name: "Python Programming",
        description: "Introduction to Python programming and data structures",
        teacherId: "teacher-3",
        createdAt: new Date(baseDate.getTime() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(baseDate.getTime() - 5 * 60 * 60 * 1000),
        students: [],
        assignments: [],
        studentInfo: [
          {
            id: "student-11",
            name: "Valeria Herrera",
            email: "valeria.herrera@email.com",
            progress: 85,
            lastActive: new Date(baseDate.getTime() - 1 * 60 * 60 * 1000),
            assignmentsCompleted: 7,
            totalAssignments: 8,
            averageGrade: 87
          }
        ],
        recentActivity: [
          {
            studentId: "student-11",
            studentName: "Valeria Herrera",
            action: "Submitted Data Structures Quiz",
            timestamp: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000)
          }
        ],
        stats: {
          totalStudents: 20,
          activeStudents: 18,
          averageProgress: 83,
          pendingSubmissions: 5
        }
      }
    ];

    return [...teacherClasses, ...additionalClasses];
  }

  return teacherClasses;
}
