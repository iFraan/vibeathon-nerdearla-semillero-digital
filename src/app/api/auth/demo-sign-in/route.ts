import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const DEMO_USER_ID = "demo-user-id";
    
    // Check if demo user exists, create if not
    let demoUser = await db.query.users.findFirst({
      where: eq(users.id, DEMO_USER_ID),
    });

    if (!demoUser) {
      await db.insert(users).values({
        id: DEMO_USER_ID,
        email: "demo@semillero.digital",
        name: "Usuario Demo",
        image: null,
        emailVerified: true,
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      demoUser = await db.query.users.findFirst({
        where: eq(users.id, DEMO_USER_ID),
      });
    }

    if (!demoUser) {
      return NextResponse.json({ error: "Failed to create demo user" }, { status: 500 });
    }

    // Create session using better-auth
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: demoUser.id,
      }),
    });

    console.log({sessionResponse})

    if (!sessionResponse.ok) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const sessionData = await sessionResponse.json();
    
    // Set session cookie
    const response = NextResponse.json({ success: true, user: demoUser });
    
    // Copy session cookies from the session response
    const cookies = sessionResponse.headers.get('set-cookie');
    if (cookies) {
      response.headers.set('set-cookie', cookies);
    }

    return response;
  } catch (error) {
    console.error("Demo sign in error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
