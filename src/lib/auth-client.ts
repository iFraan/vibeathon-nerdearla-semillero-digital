"use client";

import { createAuthClient } from "better-auth/client";
import type { AuthUser } from "@/types/auth";

// Client-side auth methods
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;

// Helper functions for client-side auth
export async function getCurrentUser() {
  try {
    const { data: session } = await authClient.getSession();
    return session?.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function handleSignIn(provider: string = "google", returnTo?: string) {
  try {
    await signIn.social({
      provider: provider as any,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

export async function handleSignOut(returnTo: string = "/") {
  try {
    await signOut();
    window.location.href = returnTo;
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

export function hasRole(user: AuthUser | null, roles: string | string[]): boolean {
  if (!user) return false;
  
  const userRole = user.role;
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
}

export function canAccess(user: AuthUser | null, resource: string): boolean {
  if (!user) return false;

  const permissions = {
    student: ["dashboard", "assignments", "grades", "notifications", "profile"],
    teacher: ["dashboard", "assignments", "grades", "notifications", "profile", "class-management", "student-progress", "reports"],
    coordinator: ["dashboard", "assignments", "grades", "notifications", "profile", "class-management", "student-progress", "reports", "analytics", "user-management", "system-settings"],
  };

  return permissions[user.role]?.includes(resource) || false;
}
