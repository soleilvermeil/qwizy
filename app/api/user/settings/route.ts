import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";

// PUT /api/user/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const body = await request.json();
    const { newCardsPerDay, currentPassword, newPassword } = body;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updates: {
      newCardsPerDay?: number;
      passwordHash?: string;
      mustChangePassword?: boolean;
    } = {};

    // Update new cards per day
    if (newCardsPerDay !== undefined) {
      // Reject if locked by admin
      if (user.newCardsPerDayLocked) {
        return NextResponse.json(
          { error: "This setting has been locked by your administrator" },
          { status: 403 }
        );
      }

      const value = parseInt(newCardsPerDay);
      if (isNaN(value) || value < 1 || value > 100) {
        return NextResponse.json(
          { error: "New cards per day must be between 1 and 100" },
          { status: 400 }
        );
      }
      updates.newCardsPerDay = value;
    }

    // Change password
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Verify current password (unless user has no password - admin, or mustChangePassword is set)
      if (user.passwordHash && !user.mustChangePassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required" },
            { status: 400 }
          );
        }

        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      updates.passwordHash = await hashPassword(newPassword);

      // Clear mustChangePassword flag if it was set
      if (user.mustChangePassword) {
        updates.mustChangePassword = false;
      }
    }

    // Apply updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No changes to save" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        username: true,
        isAdmin: true,
        accountType: true,
        mustChangePassword: true,
        newCardsPerDay: true,
        newCardsPerDayLocked: true,
      },
    });

    // If mustChangePassword was cleared, refresh the session
    if (updates.mustChangePassword === false) {
      await createSession({
        id: updatedUser.id,
        username: updatedUser.username,
        isAdmin: updatedUser.isAdmin,
        accountType: updatedUser.accountType,
        mustChangePassword: false,
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
