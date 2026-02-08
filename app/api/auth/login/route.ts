import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password || "");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await createSession(user);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
