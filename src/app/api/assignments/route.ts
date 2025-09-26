import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const assignments = generateMockAssignments(userRole, status, courseId);

    return NextResponse.json({ data: assignments });
  } catch (error) {
    console.error("Assignments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMockAssignments(
  role: string,
  statusFilter?: string | null,
  courseFilter?: string | null
): AssignmentWithDetails[] {
  const baseDate = new Date();
  
  const allAssignments: AssignmentWithDetails[] = [
    {
      id: "1",
      courseId: "course-1",
      googleClassroomId: "gc-assignment-1",
      title: "JavaScript Functions Exercise",
      description: "Create functions to solve common programming problems using ES6+ syntax",
      dueDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      courseName: "Web Development",
      teacherName: "Prof. Ana García",
      submissionCount: role === "student" ? 1 : 28,
      gradedCount: role === "student" ? 1 : 25,
      createdAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      submissions: [],
      mySubmission: role === "student" ? {
        id: "sub-1",
        assignmentId: "1",
        studentId: "student-1",
        googleSubmissionId: "gc-sub-1",
        status: "turned_in",
        grade: 95,
        submittedAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
        gradedAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000)
      } : undefined
    },
    {
      id: "2",
      courseId: "course-2",
      googleClassroomId: "gc-assignment-2",
      title: "React Components Project",
      description: "Build a weather app using React hooks and component composition",
      dueDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      maxPoints: 150,
      courseName: "Advanced React",
      teacherName: "Prof. Carlos López",
      submissionCount: role === "student" ? 0 : 15,
      gradedCount: role === "student" ? 0 : 8,
      createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      submissions: [],
      mySubmission: role === "student" ? {
        id: "sub-2",
        assignmentId: "2",
        studentId: "student-1",
        googleSubmissionId: "gc-sub-2",
        status: "assigned",
        submittedAt: undefined,
        gradedAt: undefined
      } : undefined
    },
    {
      id: "3",
      courseId: "course-3",
      googleClassroomId: "gc-assignment-3",
      title: "Database Design Quiz",
      description: "Multiple choice quiz covering normalization and entity relationships",
      dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      maxPoints: 50,
      courseName: "Database Design",
      teacherName: "Prof. María Rodríguez",
      submissionCount: role === "student" ? 0 : 22,
      gradedCount: role === "student" ? 0 : 22,
      createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      submissions: [],
      mySubmission: role === "student" ? {
        id: "sub-3",
        assignmentId: "3",
        studentId: "student-1",
        googleSubmissionId: "gc-sub-3",
        status: "assigned",
        submittedAt: undefined,
        gradedAt: undefined
      } : undefined
    },
    {
      id: "4",
      courseId: "course-1",
      googleClassroomId: "gc-assignment-4",
      title: "HTML/CSS Layout Project",
      description: "Create a responsive portfolio website using modern CSS techniques",
      dueDate: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      maxPoints: 120,
      courseName: "Web Development",
      teacherName: "Prof. Ana García",
      submissionCount: role === "student" ? 1 : 30,
      gradedCount: role === "student" ? 1 : 30,
      createdAt: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
      submissions: [],
      mySubmission: role === "student" ? {
        id: "sub-4",
        assignmentId: "4",
        studentId: "student-1",
        googleSubmissionId: "gc-sub-4",
        status: "returned",
        grade: 88,
        submittedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000)
      } : undefined
    },
    {
      id: "5",
      courseId: "course-2",
      googleClassroomId: "gc-assignment-5",
      title: "State Management Workshop",
      description: "Implement Redux Toolkit for state management in a todo application",
      dueDate: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
      courseName: "Advanced React",
      teacherName: "Prof. Carlos López",
      submissionCount: role === "student" ? 0 : 5,
      gradedCount: role === "student" ? 0 : 2,
      createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      submissions: [],
      mySubmission: role === "student" ? {
        id: "sub-5",
        assignmentId: "5",
        studentId: "student-1",
        googleSubmissionId: "gc-sub-5",
        status: "assigned",
        submittedAt: undefined,
        gradedAt: undefined
      } : undefined
    }
  ];

  // Filter by role
  let filteredAssignments = allAssignments;
  
  if (role === "teacher") {
    // Teachers see assignments from their courses
    filteredAssignments = allAssignments.filter(a => 
      a.courseName === "Web Development" || a.courseName === "Advanced React"
    );
  }

  // Apply status filter
  if (statusFilter && role === "student") {
    filteredAssignments = filteredAssignments.filter(assignment => {
      const submission = assignment.mySubmission;
      if (!submission) return statusFilter === "assigned";
      
      switch (statusFilter) {
        case "assigned":
          return submission.status === "assigned";
        case "turned_in":
          return submission.status === "turned_in";
        case "returned":
          return submission.status === "returned";
        case "overdue":
          return assignment.dueDate && assignment.dueDate < new Date() && submission.status === "assigned";
        default:
          return true;
      }
    });
  } else if (statusFilter && role === "teacher") {
    filteredAssignments = filteredAssignments.filter(assignment => {
      switch (statusFilter) {
        case "pending_review":
          return assignment.submissionCount > assignment.gradedCount;
        case "graded":
          return assignment.gradedCount === assignment.submissionCount && assignment.submissionCount > 0;
        case "no_submissions":
          return assignment.submissionCount === 0;
        default:
          return true;
      }
    });
  }

  // Apply course filter
  if (courseFilter) {
    filteredAssignments = filteredAssignments.filter(a => a.courseId === courseFilter);
  }

  return filteredAssignments.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}
