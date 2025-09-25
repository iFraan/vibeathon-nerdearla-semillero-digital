import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { google } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/classroom.courses.readonly",
        "https://www.googleapis.com/auth/classroom.coursework.students.readonly", 
        "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
        "https://www.googleapis.com/auth/classroom.rosters.readonly",
        "https://www.googleapis.com/auth/classroom.profile.emails"
      ].join(" "),
    },
  },
  plugins: [
    google(),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
      },
      googleId: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  advanced: {
    cookiePrefix: "semillero-auth",
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
