import { assignmentsRouter } from "@/server/api/routers/assignments";
import { classesRouter } from "@/server/api/routers/classes";
import { coursesRouter } from "@/server/api/routers/courses";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { notificationsRouter } from "@/server/api/routers/notifications";
import { postRouter } from "@/server/api/routers/post";
import { submissionsRouter } from "@/server/api/routers/submissions";
import { syncRouter } from "@/server/api/routers/sync";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	post: postRouter,
	assignments: assignmentsRouter,
	classes: classesRouter,
	courses: coursesRouter,
	dashboard: dashboardRouter,
	notifications: notificationsRouter,
	submissions: submissionsRouter,
	sync: syncRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
