import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/database";
import {
	courses as coursesTable,
	coursework,
	enrollments,
	studentProgress,
	submissions,
} from "@/lib/db/schema";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

// --- Types for course data ---

type BaseCourse = {
	id: string;
	name: string;
	section: string;
	description: string;
	room: string | null;
	state: string;
	enrollmentCount: number;
	activeAssignments: number;
	startDate: string | null;
	endDate: string | null;
	completionRate: number;
	averageGrade: number;
	alternateLink: string | null;
};

type StudentCoursesData = {
	courses: BaseCourse[];
	userRole: "student";
};

type TeacherCoursesData = {
	courses: BaseCourse[];
	userRole: "teacher";
};

type CoordinatorStats = {
	totalCourses: number;
	totalStudents: number;
	totalActiveAssignments: number;
	averageCompletion: number;
};

type CoordinatorCoursesData = {
	courses: BaseCourse[];
	stats: CoordinatorStats;
	userRole: "coordinator";
};

type CoursesData = StudentCoursesData | TeacherCoursesData | CoordinatorCoursesData;

// Helper functions from REST API logic

async function getStudentCourses(userId: string): Promise<StudentCoursesData> {
	// Get student's enrolled courses
	const studentEnrollments = await db.query.enrollments.findMany({
		where: and(
			eq(enrollments.userId, userId),
			eq(enrollments.roleInCourse, "STUDENT"),
		),
		with: {
			course: {
				with: {
					coursework: {
						columns: { id: true, state: true, dueDate: true },
					},
				},
			},
		},
	});

	// Get student progress for each course
	const progressData = await db.query.studentProgress.findMany({
		where: eq(studentProgress.studentId, userId),
	});

	const progressMap = progressData.reduce(
		(acc, progress) => {
			acc[progress.courseId] = progress;
			return acc;
		},
		{} as Record<string, any>,
	);

	const courses = studentEnrollments.map((enrollment) => {
		const course = enrollment.course;
		const progress = progressMap[course.id];
		const activeAssignments =
			course.coursework?.filter((cw) => cw.state === "PUBLISHED") || [];

		return {
			id: course.id,
			name: course.name,
			section: course.section || "Sin sección",
			description: course.description || "Sin descripción",
			room: course.room,
			state: course.state || "Sin estado",
			enrollmentCount: 0, // Students don't see this
			activeAssignments: activeAssignments.length,
			startDate: course.startDate ? course.startDate.toISOString() : null,
			endDate: course.endDate ? course.endDate.toISOString() : null,
			completionRate: progress?.completionRate || 0,
			averageGrade: progress?.averageGrade || 0,
			alternateLink: course.alternateLink,
		};
	});

	return { courses, userRole: "student" };
}

async function getTeacherCourses(userId: string): Promise<TeacherCoursesData> {
	// Get teacher's courses
	const teacherEnrollments = await db.query.enrollments.findMany({
		where: and(
			eq(enrollments.userId, userId),
			eq(enrollments.roleInCourse, "TEACHER"),
		),
		with: {
			course: {
				with: {
					enrollments: {
						where: eq(enrollments.roleInCourse, "STUDENT"),
						columns: { id: true },
					},
					coursework: {
						columns: { id: true, state: true, dueDate: true },
						with: {
							submissions: {
								columns: { state: true, assignedGrade: true },
							},
						},
					},
				},
			},
		},
	});

	const courses = teacherEnrollments.map((enrollment) => {
		const course = enrollment.course;
		const studentCount = course.enrollments?.length || 0;
		const activeAssignments =
			course.coursework?.filter((cw) => cw.state === "PUBLISHED") || [];

		// Calculate average grade for the course
		const allSubmissions =
			course.coursework?.flatMap((cw) => cw.submissions || []) || [];
		const gradedSubmissions = allSubmissions.filter(
			(sub) => sub.assignedGrade !== null,
		);
		const averageGrade =
			gradedSubmissions.length > 0
				? Math.round(
						gradedSubmissions.reduce(
							(acc, sub) => acc + (sub.assignedGrade || 0),
							0,
						) / gradedSubmissions.length,
					)
				: 0;

		// Calculate completion rate (submitted assignments / total assignments)
		const totalAssignments = course.coursework?.length || 0;
		const submittedCount = allSubmissions.filter(
			(sub) => sub.state === "TURNED_IN",
		).length;
		const completionRate =
			totalAssignments > 0 && studentCount > 0
				? Math.round((submittedCount / (totalAssignments * studentCount)) * 100)
				: 0;

		return {
			id: course.id,
			name: course.name,
			section: course.section || "Sin sección",
			description: course.description || "Sin descripción",
			room: course.room,
			state: course.state || "Sin estado",
			enrollmentCount: studentCount,
			activeAssignments: activeAssignments.length,
			startDate: course.startDate ? course.startDate.toISOString() : null,
			endDate: course.endDate ? course.endDate.toISOString() : null,
			completionRate,
			averageGrade,
			alternateLink: course.alternateLink,
		};
	});

	return { courses, userRole: "teacher" };
}

async function getCoordinatorCourses(): Promise<CoordinatorCoursesData> {
	// Get all courses with comprehensive data
	const allCourses = await db.query.courses.findMany({
		with: {
			enrollments: {
				columns: { roleInCourse: true },
			},
			coursework: {
				columns: { id: true, state: true },
				with: {
					submissions: {
						columns: { state: true, assignedGrade: true },
					},
				},
			},
		},
		orderBy: [desc(coursesTable.createdAt)],
	});

	// Get system-wide statistics
	const totalStudents = await db
		.select({ count: sql<number>`count(*)` })
		.from(enrollments)
		.where(eq(enrollments.roleInCourse, "STUDENT"));

	const totalActiveAssignments = await db
		.select({ count: sql<number>`count(*)` })
		.from(coursework)
		.where(eq(coursework.state, "PUBLISHED"));

	const coursesData = allCourses.map((course: any) => {
		const studentEnrollments =
			course.enrollments?.filter((e: any) => e.roleInCourse === "STUDENT") ||
			[];
		const studentCount = studentEnrollments.length;
		const activeAssignments =
			course.coursework?.filter((cw: any) => cw.state === "PUBLISHED") || [];

		// Calculate metrics for this course
		const allSubmissions =
			course.coursework?.flatMap((cw: any) => cw.submissions || []) || [];
		const gradedSubmissions = allSubmissions.filter(
			(sub: any) => sub.assignedGrade !== null,
		);
		const averageGrade =
			gradedSubmissions.length > 0
				? Math.round(
						gradedSubmissions.reduce(
							(acc: number, sub: any) => acc + (sub.assignedGrade || 0),
							0,
						) / gradedSubmissions.length,
					)
				: 0;

		const totalAssignments = course.coursework?.length || 0;
		const submittedCount = allSubmissions.filter(
			(sub: any) => sub.state === "TURNED_IN",
		).length;
		const completionRate =
			totalAssignments > 0 && studentCount > 0
				? Math.round((submittedCount / (totalAssignments * studentCount)) * 100)
				: 0;

		return {
			id: course.id,
			name: course.name,
			section: course.section || "Sin sección",
			description: course.description || "Sin descripción",
			room: course.room,
			state: course.state || "Sin estado",
			enrollmentCount: studentCount,
			activeAssignments: activeAssignments.length,
			startDate: course.startDate ? course.startDate.toISOString() : null,
			endDate: course.endDate ? course.endDate.toISOString() : null,
			completionRate,
			averageGrade,
			alternateLink: course.alternateLink,
		};
	});

	const stats = {
		totalCourses: allCourses.length,
		totalStudents: totalStudents[0]?.count || 0,
		totalActiveAssignments: totalActiveAssignments[0]?.count || 0,
		averageCompletion:
			coursesData.length > 0
				? Math.round(
						coursesData.reduce(
							(acc: number, course: any) => acc + course.completionRate,
							0,
						) / coursesData.length,
					)
				: 0,
	};

	return { courses: coursesData, stats, userRole: "coordinator" };
}

export const coursesRouter = createTRPCRouter({
	list: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
		const session = ctx.session;
		if (!session?.user) {
			throw new Error("Unauthorized");
		}
		const userId = session.user.id;
		const userRole = (session.user as any).role || "student";
		let coursesData: CoursesData;

		switch (userRole) {
			case "student":
				coursesData = await getStudentCourses(userId);
				break;
			case "teacher":
				coursesData = await getTeacherCourses(userId);
				break;
			case "coordinator":
				coursesData = await getCoordinatorCourses();
				break;
			default:
				throw new Error("Invalid user role");
		}

		return coursesData;
	}),
});


// export const coursesRouter = createTRPCRouter({
//   hello: publicProcedure
//     .input(z.object({ text: z.string() }))
//     .query(({ input }) => {
//       return {
//         greeting: `Hello ${input.text}`,
//       };
//     }),

//   getAll: protectedProcedure.query(async ({ctx}) => {
//     const courses = await ctx.db.query.courses.findMany()
//     return courses
//   }),

//   // create: protectedProcedure
//   //   .input(z.object({ name: z.string().min(1) }))
//   //   .mutation(async ({ ctx, input }) => {
//   //     await ctx.db.insert(posts).values({
//   //       name: input.name,
//   //       createdById: ctx.session.user.id,
//   //     });
//   //   }),

//   // getLatest: protectedProcedure.query(async ({ ctx }) => {
//   //   const post = await ctx.db.query.posts.findFirst({
//   //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
//   //   });

//   //   return post ?? null;
//   // }),

//   getSecretMessage: protectedProcedure.query(() => {
//     return "you can now see this secret message!";
//   }),
// });
