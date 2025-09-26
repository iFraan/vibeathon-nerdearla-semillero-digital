import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { User } from "@/types";

interface Notification {
  id: string;
  type: "assignment" | "grade" | "announcement" | "reminder" | "system";
  title: string;
  message: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  actionUrl?: string;
  courseId?: string;
  courseName?: string;
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
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type");

    const userRole = (session.user as any).role || "student";
    const notifications = generateMockNotifications(userRole, unreadOnly, type);

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("Notifications API error:", error);
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

    const { notificationId, isRead } = await request.json();

    // In a real app, you would update the database here
    // For now, we'll just return success
    
    return NextResponse.json({ 
      data: { 
        success: true, 
        message: `Notification ${isRead ? 'marked as read' : 'marked as unread'}` 
      } 
    });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { action } = await request.json();

    if (action === "markAllAsRead") {
      // In a real app, you would update all notifications for the user
      return NextResponse.json({ 
        data: { 
          success: true, 
          message: "All notifications marked as read" 
        } 
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Notification action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMockNotifications(
  role: string,
  unreadOnly: boolean = false,
  typeFilter?: string | null
): Notification[] {
  const baseDate = new Date();
  
  const allNotifications: Notification[] = role === "coordinator" 
    ? [
        {
          id: "1",
          type: "system",
          title: "Weekly Report Available",
          message: "The weekly progress report for all courses is now available for review.",
          isRead: false,
          priority: "high",
          createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
          actionUrl: "/dashboard/reports"
        },
        {
          id: "2",
          type: "assignment",
          title: "New Assignment Created",
          message: "Prof. Ana García created 'JavaScript Functions Exercise' in Web Development.",
          isRead: false,
          priority: "medium",
          createdAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000),
          courseId: "course-1",
          courseName: "Web Development",
          actionUrl: "/assignments/1"
        },
        {
          id: "3",
          type: "system",
          title: "Low Student Engagement Alert",
          message: "Database Design course has 3 students with no recent activity.",
          isRead: true,
          priority: "high",
          createdAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000),
          courseId: "course-3",
          courseName: "Database Design",
          actionUrl: "/classes/course-3"
        },
        {
          id: "4",
          type: "announcement",
          title: "Teacher Meeting Scheduled",
          message: "Monthly coordination meeting scheduled for next Friday at 10:00 AM.",
          isRead: true,
          priority: "medium",
          createdAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000)
        },
        {
          id: "5",
          type: "system",
          title: "Data Sync Completed",
          message: "Google Classroom data synchronization completed successfully.",
          isRead: true,
          priority: "low",
          createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000)
        }
      ]
    : role === "teacher"
    ? [
        {
          id: "1",
          type: "assignment",
          title: "New Submission Received",
          message: "María González submitted 'React Components Project'.",
          isRead: false,
          priority: "medium",
          createdAt: new Date(baseDate.getTime() - 30 * 60 * 1000),
          courseId: "course-2",
          courseName: "Advanced React",
          actionUrl: "/submissions/2"
        },
        {
          id: "2",
          type: "assignment",
          title: "Assignment Due Soon",
          message: "'JavaScript Functions Exercise' is due in 2 days. 5 students haven't submitted yet.",
          isRead: false,
          priority: "high",
          createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
          courseId: "course-1",
          courseName: "Web Development",
          actionUrl: "/assignments/1"
        },
        {
          id: "3",
          type: "grade",
          title: "Grading Reminder",
          message: "You have 8 submissions pending review in Web Development.",
          isRead: false,
          priority: "medium",
          createdAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000),
          courseId: "course-1",
          courseName: "Web Development",
          actionUrl: "/submissions?status=pending"
        },
        {
          id: "4",
          type: "announcement",
          title: "Course Update Available",
          message: "Google Classroom sync detected changes in your course materials.",
          isRead: true,
          priority: "low",
          createdAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000)
        },
        {
          id: "5",
          type: "system",
          title: "Weekly Summary",
          message: "Your classes had 89% attendance this week. View detailed analytics.",
          isRead: true,
          priority: "low",
          createdAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
          actionUrl: "/dashboard/analytics"
        }
      ]
    : [
        {
          id: "1",
          type: "grade",
          title: "Assignment Graded",
          message: "You received 95/100 on 'JavaScript Functions Exercise'.",
          isRead: false,
          priority: "high",
          createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
          courseId: "course-1",
          courseName: "Web Development",
          actionUrl: "/assignments/1"
        },
        {
          id: "2",
          type: "assignment",
          title: "New Assignment Available",
          message: "'React Components Project' has been assigned in Advanced React.",
          isRead: false,
          priority: "medium",
          createdAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000),
          courseId: "course-2",
          courseName: "Advanced React",
          actionUrl: "/assignments/2"
        },
        {
          id: "3",
          type: "reminder",
          title: "Assignment Due Tomorrow",
          message: "'React Components Project' is due tomorrow at 11:59 PM.",
          isRead: false,
          priority: "high",
          createdAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000),
          courseId: "course-2",
          courseName: "Advanced React",
          actionUrl: "/assignments/2"
        },
        {
          id: "4",
          type: "announcement",
          title: "Class Schedule Update",
          message: "Database Design class moved to 2:00 PM this Thursday.",
          isRead: true,
          priority: "medium",
          createdAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
          courseId: "course-3",
          courseName: "Database Design"
        },
        {
          id: "5",
          type: "grade",
          title: "Feedback Available",
          message: "Prof. Ana García left detailed feedback on your HTML/CSS project.",
          isRead: true,
          priority: "medium",
          createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          courseId: "course-1",
          courseName: "Web Development",
          actionUrl: "/assignments/4"
        }
      ];

  // Apply filters
  let filteredNotifications = allNotifications;

  if (unreadOnly) {
    filteredNotifications = filteredNotifications.filter(n => !n.isRead);
  }

  if (typeFilter) {
    filteredNotifications = filteredNotifications.filter(n => n.type === typeFilter);
  }

  return filteredNotifications.sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}
