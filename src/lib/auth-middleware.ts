import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import type { Session, User } from "./auth";

export interface AuthenticatedRequest extends NextRequest {
  user: User;
  session: Session;
}

export type UserRole = "student" | "teacher" | "coordinator";

export interface AuthOptions {
  requiredRoles?: UserRole[];
  redirectTo?: string;
  allowUnauthenticated?: boolean;
}

export async function getSession(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session;
}

export async function requireAuth(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<{ user: User; session: Session } | NextResponse> {
  const { requiredRoles, redirectTo = "/login", allowUnauthenticated = false } = options;

  try {
    const session = await getSession(request);

    if (!session?.user) {
      if (allowUnauthenticated) {
        return NextResponse.next();
      }
      
      const redirectUrl = new URL(redirectTo, request.url);
      redirectUrl.searchParams.set("returnTo", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Check role permissions
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = session.user.role as UserRole;
      if (!requiredRoles.includes(userRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    return { user: session.user, session };
  } catch (error) {
    console.error("Authentication error:", error);
    
    if (allowUnauthenticated) {
      return NextResponse.next();
    }
    
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

export function createRoleGuard(requiredRoles: UserRole[]) {
  return async (request: NextRequest) => {
    return requireAuth(request, { requiredRoles });
  };
}

// Predefined role guards
export const requireStudent = createRoleGuard(["student"]);
export const requireTeacher = createRoleGuard(["teacher"]);
export const requireCoordinator = createRoleGuard(["coordinator"]);
export const requireTeacherOrCoordinator = createRoleGuard(["teacher", "coordinator"]);
export const requireAnyRole = createRoleGuard(["student", "teacher", "coordinator"]);

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Helper function for client-side auth checks
export function canAccess(userRole: UserRole, resource: string): boolean {
  const permissions = {
    student: ["dashboard", "assignments", "grades", "notifications"],
    teacher: ["dashboard", "assignments", "grades", "notifications", "class-management", "student-progress"],
    coordinator: ["dashboard", "assignments", "grades", "notifications", "class-management", "student-progress", "analytics", "reports", "user-management"],
  };

  return permissions[userRole]?.includes(resource) || false;
}

export type AuthResult = 
  | { success: true; user: User; session: Session }
  | { success: false; error: string; redirect?: string };

export async function validateAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return {
        success: false,
        error: "Not authenticated",
        redirect: "/login",
      };
    }

    return {
      success: true,
      user: session.user,
      session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}
