"use client";

import { auth } from "./auth";
import type { AuthUser, AuthSession } from "@/types/auth";

// Client-side auth methods
export const authClient = auth.createClient();

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;

// Helper functions for client-side auth
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await getSession();
    return session?.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const session = await getSession();
    return session || null;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
}

export async function handleSignIn(provider: string = "google", returnTo?: string) {
  try {
    const redirectUrl = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    await signIn(provider, {
      callbackURL: `/dashboard${redirectUrl}`,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

export async function handleSignOut(returnTo: string = "/") {
  try {
    await signOut({
      callbackURL: returnTo,
    });
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
