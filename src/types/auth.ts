import type { User, UserRole } from "./database";

// Re-export UserRole for convenience
export type { UserRole } from "./database";

// Better-Auth session types
export interface AuthSession {
	id: string;
	userId: string;
	expiresAt: Date;
	ipAddress?: string;
	userAgent?: string;
	createdAt: Date;
}

export interface AuthUser extends User {
	role: UserRole;
	googleClassroomToken?: string | null;
}

export interface AuthAccount {
	id: string;
	accountId: string;
	providerId: string;
	userId: string;
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	expiresAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

// Client-side auth context types
export interface AuthContextType {
	user: AuthUser | null;
	session: AuthSession | null;
	loading: boolean;
	signIn: (provider?: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshSession: () => Promise<void>;
}

// Auth middleware types
export interface AuthRequest {
	user: AuthUser;
	session: AuthSession;
}

export interface RouteConfig {
	path: string;
	requiredRoles?: UserRole[];
	allowUnauthenticated?: boolean;
	redirectTo?: string;
}

// Permission system types
export interface Permission {
	resource: string;
	action: string;
	conditions?: Record<string, any>;
}

export interface RolePermissions {
	student: Permission[];
	teacher: Permission[];
	coordinator: Permission[];
}

export const PERMISSIONS: RolePermissions = {
	student: [
		{ resource: "dashboard", action: "view" },
		{ resource: "profile", action: "view" },
		{ resource: "profile", action: "edit", conditions: { ownProfile: true } },
		{ resource: "assignments", action: "view" },
		{ resource: "submissions", action: "create" },
		{
			resource: "submissions",
			action: "view",
			conditions: { ownSubmissions: true },
		},
		{ resource: "grades", action: "view", conditions: { ownGrades: true } },
		{
			resource: "notifications",
			action: "view",
			conditions: { ownNotifications: true },
		},
		{
			resource: "notifications",
			action: "markAsRead",
			conditions: { ownNotifications: true },
		},
		{ resource: "courses", action: "view", conditions: { enrolledOnly: true } },
		{ resource: "progress", action: "view", conditions: { ownProgress: true } },
	],
	teacher: [
		{ resource: "dashboard", action: "view" },
		{ resource: "profile", action: "view" },
		{ resource: "profile", action: "edit", conditions: { ownProfile: true } },
		{ resource: "assignments", action: "view" },
		{ resource: "assignments", action: "create" },
		{
			resource: "assignments",
			action: "edit",
			conditions: { ownCourse: true },
		},
		{
			resource: "assignments",
			action: "delete",
			conditions: { ownCourse: true },
		},
		{
			resource: "submissions",
			action: "view",
			conditions: { ownCourse: true },
		},
		{
			resource: "submissions",
			action: "grade",
			conditions: { ownCourse: true },
		},
		{ resource: "grades", action: "view", conditions: { ownCourse: true } },
		{ resource: "grades", action: "edit", conditions: { ownCourse: true } },
		{ resource: "notifications", action: "view" },
		{
			resource: "notifications",
			action: "create",
			conditions: { ownCourse: true },
		},
		{
			resource: "notifications",
			action: "markAsRead",
			conditions: { ownNotifications: true },
		},
		{ resource: "courses", action: "view", conditions: { teachingOnly: true } },
		{ resource: "courses", action: "edit", conditions: { ownCourse: true } },
		{ resource: "students", action: "view", conditions: { ownCourse: true } },
		{ resource: "progress", action: "view", conditions: { ownCourse: true } },
		{ resource: "reports", action: "view", conditions: { ownCourse: true } },
		{
			resource: "classManagement",
			action: "view",
			conditions: { ownCourse: true },
		},
	],
	coordinator: [
		{ resource: "dashboard", action: "view" },
		{ resource: "profile", action: "view" },
		{ resource: "profile", action: "edit" },
		{ resource: "assignments", action: "view" },
		{ resource: "assignments", action: "create" },
		{ resource: "assignments", action: "edit" },
		{ resource: "assignments", action: "delete" },
		{ resource: "submissions", action: "view" },
		{ resource: "submissions", action: "grade" },
		{ resource: "grades", action: "view" },
		{ resource: "grades", action: "edit" },
		{ resource: "notifications", action: "view" },
		{ resource: "notifications", action: "create" },
		{ resource: "notifications", action: "markAsRead" },
		{ resource: "notifications", action: "delete" },
		{ resource: "courses", action: "view" },
		{ resource: "courses", action: "create" },
		{ resource: "courses", action: "edit" },
		{ resource: "courses", action: "delete" },
		{ resource: "courses", action: "manage" },
		{ resource: "users", action: "view" },
		{ resource: "users", action: "create" },
		{ resource: "users", action: "edit" },
		{ resource: "users", action: "delete" },
		{ resource: "users", action: "promote" },
		{ resource: "users", action: "demote" },
		{ resource: "students", action: "view" },
		{ resource: "students", action: "manage" },
		{ resource: "teachers", action: "view" },
		{ resource: "teachers", action: "manage" },
		{ resource: "progress", action: "view" },
		{ resource: "progress", action: "edit" },
		{ resource: "reports", action: "view" },
		{ resource: "reports", action: "create" },
		{ resource: "reports", action: "export" },
		{ resource: "analytics", action: "view" },
		{ resource: "analytics", action: "export" },
		{ resource: "classManagement", action: "view" },
		{ resource: "classManagement", action: "manage" },
		{ resource: "userManagement", action: "view" },
		{ resource: "userManagement", action: "manage" },
		{ resource: "systemSettings", action: "view" },
		{ resource: "systemSettings", action: "edit" },
	],
};

// Auth state types
export interface AuthState {
	isAuthenticated: boolean;
	user: AuthUser | null;
	session: AuthSession | null;
	loading: boolean;
	error: string | null;
}

export interface AuthAction {
	type: "SET_LOADING" | "SET_USER" | "SET_ERROR" | "CLEAR_AUTH";
	payload?: any;
}

// Login/logout types
export interface LoginCredentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	success: boolean;
	user?: AuthUser;
	session?: AuthSession;
	error?: string;
	redirectTo?: string;
}

export interface LogoutResponse {
	success: boolean;
	error?: string;
	redirectTo?: string;
}

// OAuth types
export interface OAuthState {
	provider: string;
	returnTo?: string;
	codeVerifier?: string;
	state?: string;
}

export interface OAuthCallbackParams {
	code: string;
	state?: string;
	error?: string;
	error_description?: string;
}

// Token types for Google Classroom integration
export interface GoogleTokens {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: Date;
	scope?: string[];
}

export interface TokenRefreshResult {
	success: boolean;
	tokens?: GoogleTokens;
	error?: string;
}

// Session management types
export interface SessionOptions {
	expiresIn?: number;
	updateAge?: number;
	cookieOptions?: {
		httpOnly?: boolean;
		secure?: boolean;
		sameSite?: "strict" | "lax" | "none";
		domain?: string;
		path?: string;
	};
}

export interface RefreshSessionResult {
	success: boolean;
	session?: AuthSession;
	user?: AuthUser;
	error?: string;
}

// Security types
export interface SecurityEvent {
	type:
		| "login"
		| "logout"
		| "failed_login"
		| "password_change"
		| "token_refresh";
	userId?: string;
	ipAddress?: string;
	userAgent?: string;
	timestamp: Date;
	details?: Record<string, any>;
}

export interface RateLimitConfig {
	windowMs: number;
	max: number;
	message?: string;
	skipSuccessfulRequests?: boolean;
}

// Auth utilities types
export interface AuthUtilities {
	checkPermission: (
		user: AuthUser,
		resource: string,
		action: string,
		context?: any,
	) => boolean;
	hasRole: (user: AuthUser, roles: UserRole | UserRole[]) => boolean;
	canAccess: (user: AuthUser, path: string) => boolean;
	formatUserName: (user: AuthUser) => string;
	getUserInitials: (user: AuthUser) => string;
	isTokenExpired: (expiresAt?: Date) => boolean;
	getTimeUntilExpiry: (expiresAt?: Date) => number;
}

// Hook types
export interface UseAuthReturn {
	user: AuthUser | null;
	session: AuthSession | null;
	loading: boolean;
	error: string | null;
	signIn: (provider?: string, returnTo?: string) => Promise<void>;
	signOut: (returnTo?: string) => Promise<void>;
	refreshSession: () => Promise<void>;
	hasRole: (roles: UserRole | UserRole[]) => boolean;
	canAccess: (resource: string, action?: string) => boolean;
}

export interface UsePermissionsReturn {
	hasPermission: (resource: string, action: string, context?: any) => boolean;
	canView: (resource: string, context?: any) => boolean;
	canEdit: (resource: string, context?: any) => boolean;
	canCreate: (resource: string, context?: any) => boolean;
	canDelete: (resource: string, context?: any) => boolean;
	checkMultiple: (
		permissions: { resource: string; action: string; context?: any }[],
	) => boolean[];
}
