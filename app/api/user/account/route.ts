import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, deleteSession } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";

// DELETE /api/user/account - Delete user account and all associated data (GDPR Art. 17)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { password } = body;

    // Get the user to verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Require password confirmation for accounts that have a password
    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: "Password is required to delete your account" },
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 400 }
        );
      }
    }

    // Delete all user progress first, then the user
    // (UserProgress has onDelete: Cascade, but being explicit is safer)
    await prisma.userProgress.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    // Clear the session cookie
    await deleteSession();

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
