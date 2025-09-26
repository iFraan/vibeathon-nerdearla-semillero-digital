import { z } from "zod";
import { protectedProcedure,  createTRPCRouter,publicProcedure} from "@/server/api/trpc";
import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { coursework, notifications as notificationsTable, enrollments } from "@/lib/db/schema";

// --- Types (should be imported from shared types in a real project) ---
type Notification = {
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
};

// --- Mock Data Generator (move to shared util in real project) ---
function generateMockNotifications(
	role: string,
	unreadOnly: boolean = false,
	typeFilter?: string | null,
): Notification[] {
	const baseDate = new Date();

	const allNotifications: Notification[] =
		role === "coordinator"
			? [
					{
						id: "1",
						type: "system",
						title: "Weekly Report Available",
						message:
							"The weekly progress report for all courses is now available for review.",
						isRead: false,
						priority: "high",
						createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
						actionUrl: "/dashboard/reports",
					},
					{
						id: "2",
						type: "assignment",
						title: "New Assignment Created",
						message:
							"Prof. Ana García created 'JavaScript Functions Exercise' in Web Development.",
						isRead: false,
						priority: "medium",
						createdAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000),
						courseId: "course-1",
						courseName: "Web Development",
						actionUrl: "/assignments/1",
					},
					{
						id: "3",
						type: "system",
						title: "Low Student Engagement Alert",
						message:
							"Database Design course has 3 students with no recent activity.",
						isRead: true,
						priority: "high",
						createdAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000),
						courseId: "course-3",
						courseName: "Database Design",
						actionUrl: "/classes/course-3",
					},
					{
						id: "4",
						type: "announcement",
						title: "Teacher Meeting Scheduled",
						message:
							"Monthly coordination meeting scheduled for next Friday at 10:00 AM.",
						isRead: true,
						priority: "medium",
						createdAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
					},
					{
						id: "5",
						type: "system",
						title: "Data Sync Completed",
						message:
							"Google Classroom data synchronization completed successfully.",
						isRead: true,
						priority: "low",
						createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
					},
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
							actionUrl: "/submissions/2",
						},
						{
							id: "2",
							type: "assignment",
							title: "Assignment Due Soon",
							message:
								"'JavaScript Functions Exercise' is due in 2 days. 5 students haven't submitted yet.",
							isRead: false,
							priority: "high",
							createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
							courseId: "course-1",
							courseName: "Web Development",
							actionUrl: "/assignments/1",
						},
						{
							id: "3",
							type: "grade",
							title: "Grading Reminder",
							message:
								"You have 8 submissions pending review in Web Development.",
							isRead: false,
							priority: "medium",
							createdAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000),
							courseId: "course-1",
							courseName: "Web Development",
							actionUrl: "/submissions?status=pending",
						},
						{
							id: "4",
							type: "announcement",
							title: "Course Update Available",
							message:
								"Google Classroom sync detected changes in your course materials.",
							isRead: true,
							priority: "low",
							createdAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000),
						},
						{
							id: "5",
							type: "system",
							title: "Weekly Summary",
							message:
								"Your classes had 89% attendance this week. View detailed analytics.",
							isRead: true,
							priority: "low",
							createdAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
							actionUrl: "/dashboard/analytics",
						},
					]
				: [
						{
							id: "1",
							type: "grade",
							title: "Assignment Graded",
							message:
								"You received 95/100 on 'JavaScript Functions Exercise'.",
							isRead: false,
							priority: "high",
							createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
							courseId: "course-1",
							courseName: "Web Development",
							actionUrl: "/assignments/1",
						},
						{
							id: "2",
							type: "assignment",
							title: "New Assignment Available",
							message:
								"'React Components Project' has been assigned in Advanced React.",
							isRead: false,
							priority: "medium",
							createdAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000),
							courseId: "course-2",
							courseName: "Advanced React",
							actionUrl: "/assignments/2",
						},
						{
							id: "3",
							type: "reminder",
							title: "Assignment Due Tomorrow",
							message:
								"'React Components Project' is due tomorrow at 11:59 PM.",
							isRead: false,
							priority: "high",
							createdAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000),
							courseId: "course-2",
							courseName: "Advanced React",
							actionUrl: "/assignments/2",
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
							courseName: "Database Design",
						},
						{
							id: "5",
							type: "grade",
							title: "Feedback Available",
							message:
								"Prof. Ana García left detailed feedback on your HTML/CSS project.",
							isRead: true,
							priority: "medium",
							createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
							courseId: "course-1",
							courseName: "Web Development",
							actionUrl: "/assignments/4",
						},
					];

	// Apply filters
	let filteredNotifications = allNotifications;

	if (unreadOnly) {
		filteredNotifications = filteredNotifications.filter((n) => !n.isRead);
	}

	if (typeFilter) {
		filteredNotifications = filteredNotifications.filter(
			(n) => n.type === typeFilter,
		);
	}

	return filteredNotifications.sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	);
}

// --- tRPC Router ---
export const notificationsRouter = createTRPCRouter({
	// GET /api/notifications
	list: protectedProcedure
		.input(
			z
				.object({
					unreadOnly: z.boolean().optional(),
					type: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const user = ctx.session?.user;
			if (!user) throw new Error("Authentication required");

			const userRole = (user as any).role || "student";
			const unreadOnly = input?.unreadOnly ?? false;
			const type = input?.type ?? undefined;

			const notifications = generateMockNotifications(
				userRole,
				unreadOnly,
				type,
			);
			return notifications;
		}),

	// PATCH /api/notifications
	update: protectedProcedure
		.input(
			z.object({
				notificationId: z.string(),
				isRead: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = ctx.session?.user;
			if (!user) throw new Error("Authentication required");

			// In a real app, update the notification in the DB
			return {
				success: true,
				message: `Notification ${input.isRead ? "marked as read" : "marked as unread"}`,
			};
		}),

	// POST /api/notifications (mark all as read)
	markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
		const user = ctx.session?.user;
		if (!user) throw new Error("Authentication required");

		// In a real app, update all notifications for the user in the DB
		return {
			success: true,
			message: "All notifications marked as read",
		};
	}),
  // POST /api/notifications/pollClasswork
  pollClasswork: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session?.user;
    if (!user) throw new Error("Authentication required");

    // 1. Get user's enrolled courses
    const userEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.userId, user.id),
      columns: { courseId: true },
    });
    const courseIds = userEnrollments.map(e => e.courseId);

    // 2. Setup Google Classroom API client (assumes OAuth2 is handled)
    // You must provide a valid Google OAuth2 client in your context as ctx.googleAuthClient
    const classroom = google.classroom("v1");
    const auth = ctx.googleAuthClient;
    if (!auth) throw new Error("Google API client not configured in context");

    // 3. For each course, fetch assignments and compare
    for (const courseId of courseIds) {
      // a. Fetch remote assignments
      const remoteRes = await classroom.courses.courseWork.list({
        courseId,
        auth,
      });
      const remoteAssignments = remoteRes.data.courseWork || [];

      // b. Fetch local assignments
      const localAssignments = await db.query.coursework.findMany({
        where: eq(coursework.courseId, courseId),
      });

      // c. Build maps for efficient comparison
      const remoteMap = new Map(remoteAssignments.map(a => [a.id, a]));
      const localMap = new Map(localAssignments.map(a => [a.id, a]));

      // d. Detect new or updated assignments
      for (const remote of remoteAssignments) {
        const local = localMap.get(remote.id!);
        const isNew = !local;
        const isUpdated =
          local &&
          (local.title !== remote.title ||
            local.description !== remote.description ||
            local.state !== remote.state);

        if (isNew || isUpdated) {
          // Create notification if not already present
          const existingNotif = await db.query.notifications.findFirst({
            where: eq(notificationsTable.actionUrl, `/assignments/${remote.id}`),
          });
          if (!existingNotif) {
            await db.insert(notificationsTable).values({
              userId: user.id,
              type: "assignment",
              title: isNew ? "New Assignment" : "Assignment Updated",
              message: isNew
                ? `A new assignment "${remote.title}" was posted.`
                : `Assignment "${remote.title}" was updated.`,
              isRead: false,
              priority: "medium",
              createdAt: new Date(),
              actionUrl: `/assignments/${remote.id}`,
              courseId,
              courseName: remote.courseId, // or fetch course name if needed
            });
          }
        }
      }

      // e. Detect deleted assignments
      for (const local of localAssignments) {
        if (!remoteMap.has(local.id)) {
          // Assignment deleted
          const existingNotif = await db.query.notifications.findFirst({
            where: eq(notificationsTable.actionUrl, `/assignments/${local.id}`),
          });
          if (!existingNotif) {
            await db.insert(notificationsTable).values({
              userId: user.id,
              type: "assignment",
              title: "Assignment Deleted",
              message: `Assignment "${local.title}" was removed.`,
              isRead: false,
              priority: "low",
              createdAt: new Date(),
              actionUrl: `/assignments/${local.id}`,
              courseId,
              courseName: local.courseId,
            });
          }
        }
      }
    }

    // 4. Return latest notifications for the user
    const notifications = await db.query.notifications.findMany({
      where: eq(notificationsTable.userId, user.id),
      orderBy: (notificationsTable, { desc }) => [desc(notificationsTable.createdAt)],
      limit: 20,
    });

    return notifications;
  }),
});
