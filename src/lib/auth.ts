import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "./database";
import * as schema from "./db/schema";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth credentials are required");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scope: [
        "openid",
        "email",
        "profile",
        // "https://www.googleapis.com/auth/classroom.courses.readonly",
        // "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
        // "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
        // "https://www.googleapis.com/auth/classroom.rosters.readonly",
        // "https://www.googleapis.com/auth/classroom.profile.emails",
        "https://www.googleapis.com/auth/classroom.courses.readonly",
        "https://www.googleapis.com/auth/classroom.rosters.readonly",
        "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ],
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  callbacks: {
    async signUp({ user, account }: any) {
      // Set default role for new users
      if (account?.providerId === "google") {
        await db
          .update(schema.users)
          .set({
            role: "student",
            googleClassroomToken: account.accessToken || null,
            googleRefreshToken: account.refreshToken || null,
            tokenExpiresAt: account.expiresAt ? new Date(account.expiresAt * 1000) : null,
          })
          .where(eq(schema.users.id, user.id));
      }

      return { user };
    },

    async signIn({ user, account }: any) {
      // Update Google tokens on sign in
      if (account?.providerId === "google") {
        await db
          .update(schema.users)
          .set({
            googleClassroomToken: account.accessToken || null,
            googleRefreshToken: account.refreshToken || null,
            tokenExpiresAt: account.expiresAt ? new Date(account.expiresAt * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, user.id));
      }

      return { user };
    },
  },
});

export type Session = typeof auth.$Infer.Session;
