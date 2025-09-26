import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { AuthUser, GoogleTokens, TokenRefreshResult } from '@/types/auth';
import { db } from '@/lib/database';
import { accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export class ClassroomClient {
  private oauth2Client: OAuth2Client;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  static SCOPES = {
    STUDENT: [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
      'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
    ],
    TEACHER: [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
      'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
      'https://www.googleapis.com/auth/classroom.rosters.readonly',
      'https://www.googleapis.com/auth/classroom.announcements.readonly'
    ],
    COORDINATOR: [
      'https://www.googleapis.com/auth/classroom.courses',
      'https://www.googleapis.com/auth/classroom.coursework.students',
      'https://www.googleapis.com/auth/classroom.student-submissions.students',
      'https://www.googleapis.com/auth/classroom.rosters',
      'https://www.googleapis.com/auth/classroom.announcements'
    ]
  };

  async getValidAccessToken(): Promise<string> {
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, this.userId),
      columns: {
        accessToken: true,
        refreshToken: true,
        accessTokenExpiresAt: true
      }
    });

    if (!account?.accessToken) {
      throw new Error('No access token found. User needs to authenticate.');
    }

    // Check if token is expired or expiring soon (5 minutes buffer)
    const expiresAt = account.accessTokenExpiresAt;
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
      if (!account.refreshToken) {
        throw new Error('Token expired and no refresh token available. User needs to re-authenticate.');
      }

      // Refresh the token
      const refreshResult = await this.refreshAccessToken(account.refreshToken);
      if (!refreshResult.success || !refreshResult.tokens) {
        throw new Error('Failed to refresh access token. User needs to re-authenticate.');
      }

      return refreshResult.tokens.accessToken;
    }

    return account.accessToken;
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        return {
          success: false,
          error: 'No access token received from refresh'
        };
      }

      const tokens: GoogleTokens = {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
      };

      // Update the database with new tokens
      await db.update(accounts)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: tokens.expiresAt,
          updatedAt: new Date()
        })
        .where(eq(accounts.userId, this.userId));

      return {
        success: true,
        tokens
      };
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during token refresh'
      };
    }
  }

  async getClassroomService() {
    const accessToken = await this.getValidAccessToken();
    
    this.oauth2Client.setCredentials({
      access_token: accessToken
    });

    return google.classroom({ version: 'v1', auth: this.oauth2Client });
  }

  async testConnection(): Promise<boolean> {
    try {
      const classroom = await this.getClassroomService();
      await classroom.courses.list({ pageSize: 1 });
      return true;
    } catch (error) {
      console.error('Classroom connection test failed:', error);
      return false;
    }
  }
}

export async function createClassroomClient(userId: string): Promise<ClassroomClient> {
  const client = new ClassroomClient(userId);
  
  // Test the connection
  const isConnected = await client.testConnection();
  if (!isConnected) {
    throw new Error('Unable to connect to Google Classroom. Please check your authentication.');
  }

  return client;
}

// Utility functions for scope management
export function getRequiredScopes(userRole: 'student' | 'teacher' | 'coordinator'): string[] {
  switch (userRole) {
    case 'student':
      return ClassroomClient.SCOPES.STUDENT;
    case 'teacher':
      return ClassroomClient.SCOPES.TEACHER;
    case 'coordinator':
      return ClassroomClient.SCOPES.COORDINATOR;
    default:
      return ClassroomClient.SCOPES.STUDENT;
  }
}

export function hasRequiredScopes(grantedScopes: string[], userRole: 'student' | 'teacher' | 'coordinator'): boolean {
  const requiredScopes = getRequiredScopes(userRole);
  return requiredScopes.every(scope => grantedScopes.includes(scope));
}
