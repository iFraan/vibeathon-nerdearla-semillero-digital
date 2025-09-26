import { NextRequest, NextResponse } from "next/server";
import { createSyncService } from "@/lib/classroom/sync";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Create sync service for the authenticated user
    const syncService = await createSyncService(userId);
    
    // Perform full sync
    const results = await syncService.fullSyncForUser(userId);
    
    return NextResponse.json({
      success: true,
      results,
      message: "Sync completed successfully"
    });
  } catch (error) {
    console.error("Sync failed:", error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("authentication") || error.message.includes("authenticate")) {
        return NextResponse.json(
          { 
            error: "Authentication failed", 
            message: "Please re-authenticate with Google Classroom",
            requiresReauth: true
          }, 
          { status: 401 }
        );
      }
      
      if (error.message.includes("connect") || error.message.includes("connection")) {
        return NextResponse.json(
          { 
            error: "Connection failed", 
            message: "Unable to connect to Google Classroom. Please try again later."
          }, 
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Sync failed", 
        message: "An unexpected error occurred during sync" 
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return sync status information
    // This could be enhanced to track actual sync timestamps from the database
    return NextResponse.json({
      success: true,
      lastSync: null, // Would come from database
      canSync: true,
      message: "Sync status retrieved"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get sync status" }, 
      { status: 500 }
    );
  }
}
