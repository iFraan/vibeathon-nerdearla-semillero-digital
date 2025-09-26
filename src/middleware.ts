import { NextRequest, NextResponse } from "next/server";
import { requireAuth, type UserRole } from "./lib/auth-middleware";

// Define protected routes and their role requirements
const protectedRoutes: Record<string, UserRole[]> = {
  "/dashboard": ["student", "teacher", "coordinator"],
  "/assignments": ["student", "teacher", "coordinator"],
  "/grades": ["student", "teacher", "coordinator"],
  "/courses": ["student", "teacher", "coordinator"],
  "/notifications": ["student", "teacher", "coordinator"],
  "/profile": ["student", "teacher", "coordinator"],
  
  // Teacher and Coordinator only routes
  "/class-management": ["teacher", "coordinator"],
  "/student-progress": ["teacher", "coordinator"],
  "/reports": ["teacher", "coordinator"],
  
  // Coordinator only routes
  "/analytics": ["coordinator"],
  "/user-management": ["coordinator"],
  "/system-settings": ["coordinator"],
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/api/auth",
  "/api/health",
];

// API routes that need authentication
const protectedApiRoutes: Record<string, UserRole[]> = {
  "/api/users": ["coordinator"],
  "/api/courses": ["teacher", "coordinator"],
  "/api/assignments": ["student", "teacher", "coordinator"],
  "/api/submissions": ["student", "teacher", "coordinator"],
  "/api/notifications": ["student", "teacher", "coordinator"],
  "/api/progress": ["teacher", "coordinator"],
  "/api/reports": ["teacher", "coordinator"],
  "/api/analytics": ["coordinator"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith("/api")) {
    const matchedApiRoute = Object.keys(protectedApiRoutes).find(route => 
      pathname.startsWith(route)
    );

    if (matchedApiRoute) {
      const requiredRoles = protectedApiRoutes[matchedApiRoute];
      const authResult = await requireAuth(request, { requiredRoles });
      
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      
      // Add user context to headers for API routes
      const response = NextResponse.next();
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-role", authResult.user.role);
      return response;
    }

    // For other API routes, just require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const response = NextResponse.next();
    response.headers.set("x-user-id", authResult.user.id);
    response.headers.set("x-user-role", authResult.user.role);
    return response;
  }

  // Handle page routes
  const matchedRoute = Object.keys(protectedRoutes).find(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  if (matchedRoute) {
    const requiredRoles = protectedRoutes[matchedRoute];
    const authResult = await requireAuth(request, { requiredRoles });
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Set user context in headers
    const response = NextResponse.next();
    response.headers.set("x-user-id", authResult.user.id);
    response.headers.set("x-user-role", authResult.user.role);
    return response;
  }

  // For any other protected route, require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
