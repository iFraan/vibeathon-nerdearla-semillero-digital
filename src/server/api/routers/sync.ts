import { z } from "zod";
import { createSyncService } from "@/lib/classroom/sync";
import { protectedProcedure, router } from "../trpc";

/**
 * tRPC router for sync endpoints.
 * POST: Triggers a full sync for the authenticated user.
 * GET: Returns sync status (mocked for now).
 */
export const syncRouter = router({
	trigger: protectedProcedure.mutation(async ({ ctx }) => {
		const user = ctx.session?.user;
		if (!user) {
			throw new Error("Unauthorized");
		}
		const userId = user.id;

		try {
			const syncService = await createSyncService(userId);
			const results = await syncService.fullSyncForUser(userId);

			return {
				success: true,
				results,
				message: "Sync completed successfully",
			};
		} catch (error: any) {
			if (typeof error?.message === "string") {
				if (
					error.message.includes("authentication") ||
					error.message.includes("authenticate")
				) {
					return {
						error: "Authentication failed",
						message: "Please re-authenticate with Google Classroom",
						requiresReauth: true,
					};
				}
				if (
					error.message.includes("connect") ||
					error.message.includes("connection")
				) {
					return {
						error: "Connection failed",
						message:
							"Unable to connect to Google Classroom. Please try again later.",
					};
				}
			}
			return {
				error: "Sync failed",
				message: "An unexpected error occurred during sync",
			};
		}
	}),

	status: protectedProcedure.query(async ({ ctx }) => {
		const user = ctx.session?.user;
		if (!user) {
			throw new Error("Unauthorized");
		}
		// In a real implementation, fetch last sync timestamp from DB
		return {
			success: true,
			lastSync: null,
			canSync: true,
			message: "Sync status retrieved",
		};
	}),
});
