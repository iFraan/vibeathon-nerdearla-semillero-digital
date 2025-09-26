import { z } from "zod";
import type { SubmissionWithDetails } from "@/types";
import { protectedProcedure, router } from "../trpc";

// --- MOCK LOGIC (move to shared util if needed) ---
function generateMockSubmissions(
	role: string,
	statusFilter?: string | null,
	courseFilter?: string | null,
	assignmentFilter?: string | null,
): SubmissionWithDetails[] {
	// Inline the mock data from the REST API for now
	const baseDate = new Date();

	const allSubmissions: SubmissionWithDetails[] = [
		{
			id: "sub-1",
			assignmentId: "1",
			studentId: "student-1",
			googleSubmissionId: "gc-sub-1",
			status: "turned_in",
			submittedAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000),
			assignmentTitle: "JavaScript Functions Exercise",
			courseName: "Web Development",
			studentName: "María González",
			studentEmail: "maria.gonzalez@email.com",
			submissionUrl: "https://docs.google.com/document/d/1abc123",
			attachments: ["functions.js", "README.md"],
			teacherComments: undefined,
		},
		{
			id: "sub-2",
			assignmentId: "1",
			studentId: "student-2",
			googleSubmissionId: "gc-sub-2",
			status: "turned_in",
			submittedAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000),
			assignmentTitle: "JavaScript Functions Exercise",
			courseName: "Web Development",
			studentName: "Carlos Mendoza",
			studentEmail: "carlos.mendoza@email.com",
			submissionUrl: "https://github.com/carlos/js-functions",
			attachments: ["main.js", "test.js"],
			teacherComments: undefined,
		},
		{
			id: "sub-3",
			assignmentId: "1",
			studentId: "student-3",
			googleSubmissionId: "gc-sub-3",
			status: "returned",
			grade: 88,
			submittedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
			gradedAt: new Date(baseDate.getTime() - 12 * 60 * 60 * 1000),
			assignmentTitle: "JavaScript Functions Exercise",
			courseName: "Web Development",
			studentName: "Ana Pérez",
			studentEmail: "ana.perez@email.com",
			submissionUrl: "https://codepen.io/ana-perez/pen/abc123",
			attachments: ["solution.js"],
			teacherComments:
				"Great work on the arrow functions! Consider adding more comments for complex logic.",
			rubricScore: [
				{
					criteria: "Code Quality",
					points: 18,
					maxPoints: 20,
					comment: "Clean code, good variable names",
				},
				{
					criteria: "Functionality",
					points: 20,
					maxPoints: 20,
					comment: "All functions work correctly",
				},
				{
					criteria: "Best Practices",
					points: 15,
					maxPoints: 20,
					comment: "Good use of ES6+, could improve error handling",
				},
			],
		},
		{
			id: "sub-4",
			assignmentId: "2",
			studentId: "student-6",
			googleSubmissionId: "gc-sub-4",
			status: "turned_in",
			submittedAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
			assignmentTitle: "React Components Project",
			courseName: "Advanced React",
			studentName: "Roberto Kim",
			studentEmail: "roberto.kim@email.com",
			submissionUrl: "https://github.com/roberto-kim/react-weather-app",
			attachments: ["src.zip", "demo-screenshot.png"],
			teacherComments: undefined,
		},
		{
			id: "sub-5",
			assignmentId: "2",
			studentId: "student-8",
			googleSubmissionId: "gc-sub-5",
			status: "returned",
			grade: 142,
			submittedAt: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
			gradedAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000),
			assignmentTitle: "React Components Project",
			courseName: "Advanced React",
			studentName: "Miguel Santos",
			studentEmail: "miguel.santos@email.com",
			submissionUrl: "https://react-weather-miguel.vercel.app",
			attachments: ["weather-app.zip", "deployment-guide.md"],
			teacherComments:
				"Excellent work! Great use of custom hooks and clean component structure. The UI is very polished.",
			rubricScore: [
				{
					criteria: "Component Structure",
					points: 30,
					maxPoints: 30,
					comment: "Perfect component organization",
				},
				{
					criteria: "State Management",
					points: 28,
					maxPoints: 30,
					comment: "Good use of hooks, could optimize re-renders",
				},
				{
					criteria: "UI/UX Design",
					points: 30,
					maxPoints: 30,
					comment: "Beautiful responsive design",
				},
				{
					criteria: "Code Quality",
					points: 27,
					maxPoints: 30,
					comment: "Clean code with good TypeScript usage",
				},
				{
					criteria: "Documentation",
					points: 27,
					maxPoints: 30,
					comment: "Good README and deployment guide",
				},
			],
		},
		{
			id: "sub-6",
			assignmentId: "3",
			studentId: "student-9",
			googleSubmissionId: "gc-sub-6",
			status: "turned_in",
			submittedAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000),
			assignmentTitle: "Database Design Quiz",
			courseName: "Database Design",
			studentName: "Carmen Vega",
			studentEmail: "carmen.vega@email.com",
			submissionUrl: undefined,
			attachments: [],
			teacherComments: undefined,
		},
		{
			id: "sub-7",
			assignmentId: "4",
			studentId: "student-4",
			googleSubmissionId: "gc-sub-7",
			status: "returned",
			grade: 75,
			submittedAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
			gradedAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
			assignmentTitle: "HTML/CSS Layout Project",
			courseName: "Web Development",
			studentName: "Diego Silva",
			studentEmail: "diego.silva@email.com",
			submissionUrl: "https://diego-portfolio.netlify.app",
			attachments: ["portfolio.zip"],
			teacherComments:
				"Good start! The layout works well on desktop. Focus on improving mobile responsiveness and semantic HTML.",
			rubricScore: [
				{
					criteria: "HTML Structure",
					points: 18,
					maxPoints: 25,
					comment: "Good structure, could use more semantic elements",
				},
				{
					criteria: "CSS Layout",
					points: 20,
					maxPoints: 25,
					comment: "Nice use of flexbox and grid",
				},
				{
					criteria: "Responsiveness",
					points: 12,
					maxPoints: 25,
					comment: "Needs work on mobile breakpoints",
				},
				{
					criteria: "Code Quality",
					points: 15,
					maxPoints: 25,
					comment: "Clean CSS, could organize better",
				},
				{
					criteria: "Design",
					points: 20,
					maxPoints: 25,
					comment: "Good visual hierarchy and colors",
				},
			],
		},
	];

	let filteredSubmissions = allSubmissions;

	// Filter by teacher's courses for teachers
	if (role === "teacher") {
		filteredSubmissions = filteredSubmissions.filter(
			(sub) =>
				sub.courseName === "Web Development" ||
				sub.courseName === "Advanced React",
		);
	}

	// Apply filters
	if (statusFilter) {
		if (statusFilter === "pending") {
			filteredSubmissions = filteredSubmissions.filter(
				(sub) => sub.status === "turned_in",
			);
		} else if (statusFilter === "graded") {
			filteredSubmissions = filteredSubmissions.filter(
				(sub) => sub.status === "returned",
			);
		} else {
			filteredSubmissions = filteredSubmissions.filter(
				(sub) => sub.status === statusFilter,
			);
		}
	}

	if (courseFilter) {
		filteredSubmissions = filteredSubmissions.filter(
			(sub) => sub.courseName === courseFilter,
		);
	}

	if (assignmentFilter) {
		filteredSubmissions = filteredSubmissions.filter(
			(sub) => sub.assignmentId === assignmentFilter,
		);
	}

	return filteredSubmissions.sort((a, b) => {
		// Sort by submission date, most recent first
		const dateA = a.submittedAt?.getTime() || 0;
		const dateB = b.submittedAt?.getTime() || 0;
		return dateB - dateA;
	});
}
// --- END MOCK LOGIC ---

export const submissionsRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				status: z.string().optional(),
				courseId: z.string().optional(),
				assignmentId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const user = ctx.session?.user;
			if (!user) throw new Error("Authentication required");

			const userRole = (user as any).role || "student";
			if (userRole === "student") {
				throw new Error("Insufficient permissions");
			}

			const submissions = generateMockSubmissions(
				userRole,
				input.status,
				input.courseId,
				input.assignmentId,
			);
			return submissions;
		}),

	update: protectedProcedure
		.input(
			z.object({
				submissionId: z.string(),
				grade: z.number().optional(),
				comment: z.string().optional(),
				status: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = ctx.session?.user;
			if (!user) throw new Error("Authentication required");

			const userRole = (user as any).role || "student";
			if (userRole !== "teacher" && userRole !== "coordinator") {
				throw new Error("Insufficient permissions");
			}

			// In a real app, update the DB here
			return {
				success: true,
				message: "Submission updated successfully",
				submission: {
					id: input.submissionId,
					grade: input.grade,
					comment: input.comment,
					status: input.status || "returned",
					gradedAt: new Date(),
				},
			};
		}),
});
