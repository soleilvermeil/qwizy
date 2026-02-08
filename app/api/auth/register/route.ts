import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, confirmPassword } = body;

    // Validation
    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check for invalid characters in username
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, underscores, and hyphens" },
        { status: 400 }
      );
    }

    const user = await createUser(username, password);

    await createSession(user);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Username already exists") {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
