import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/auth";

// PUT /api/admin/users/bulk - Bulk update users
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userIds,
      addGroupIds,
      removeGroupIds,
      newCardsPerDay,
      newCardsPerDayLocked,
      newPassword,
      mustChangePassword,
    } = body as {
      userIds: string[];
      addGroupIds?: string[];
      removeGroupIds?: string[];
      newCardsPerDay?: number;
      newCardsPerDayLocked?: boolean;
      newPassword?: string;
      mustChangePassword?: boolean;
    };

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "At least one user ID is required" },
        { status: 400 }
      );
    }

    // Build user update data
    const userData: Record<string, unknown> = {};
    if (typeof newCardsPerDay === "number" && newCardsPerDay >= 1 && newCardsPerDay <= 100) {
      userData.newCardsPerDay = newCardsPerDay;
    }
    if (typeof newCardsPerDayLocked === "boolean") {
      userData.newCardsPerDayLocked = newCardsPerDayLocked;
    }
    if (typeof mustChangePassword === "boolean") {
      userData.mustChangePassword = mustChangePassword;
    }
    if (newPassword && newPassword.length >= 6) {
      userData.passwordHash = await hashPassword(newPassword);
    }

    // Update user fields if any
    if (Object.keys(userData).length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          isAdmin: false,
          ...auth.scopeWhere,
        },
        data: userData,
      });
    }

    // Add group memberships (only for EDUCATION accounts)
    if (addGroupIds && addGroupIds.length > 0) {
      const educationUsers = await prisma.user.findMany({
        where: { id: { in: userIds }, accountType: "EDUCATION", ...auth.scopeWhere },
        select: { id: true },
      });
      const educationUserIds = educationUsers.map((u) => u.id);

      for (const userId of educationUserIds) {
        for (const groupId of addGroupIds) {
          await prisma.studentGroupMember.upsert({
            where: { userId_groupId: { userId, groupId } },
            update: {},
            create: { userId, groupId },
          }).catch(() => {
            // Ignore errors (non-existent users/groups)
          });
        }
      }
    }

    // Remove group memberships
    if (removeGroupIds && removeGroupIds.length > 0) {
      await prisma.studentGroupMember.deleteMany({
        where: {
          userId: { in: userIds },
          groupId: { in: removeGroupIds },
        },
      });
    }

    return NextResponse.json({ success: true, updated: userIds.length });
  } catch (error) {
    console.error("Error bulk updating users:", error);
    return NextResponse.json(
      { error: "Failed to update users" },
      { status: 500 }
    );
  }
}
