import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/users/[id] - Get single user detail
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        accountType: true,
        mustChangePassword: true,
        newCardsPerDay: true,
        newCardsPerDayLocked: true,
        createdAt: true,
        groupMemberships: {
          select: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        enrollments: {
          select: {
            deck: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        groups: user.groupMemberships.map((m) => m.group),
        decks: user.enrollments.map((e) => e.deck),
        groupMemberships: undefined,
        enrollments: undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      newPassword,
      mustChangePassword,
      newCardsPerDay,
      newCardsPerDayLocked,
      groupIds,
    } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow editing admin users
    if (user.isAdmin) {
      return NextResponse.json(
        { error: "Cannot edit admin users" },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};

    if (newPassword && newPassword.length >= 6) {
      data.passwordHash = await hashPassword(newPassword);
    }

    if (typeof mustChangePassword === "boolean") {
      data.mustChangePassword = mustChangePassword;
    }

    if (typeof newCardsPerDay === "number" && newCardsPerDay >= 1 && newCardsPerDay <= 100) {
      data.newCardsPerDay = newCardsPerDay;
    }

    if (typeof newCardsPerDayLocked === "boolean") {
      data.newCardsPerDayLocked = newCardsPerDayLocked;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        accountType: true,
        mustChangePassword: true,
        newCardsPerDay: true,
        newCardsPerDayLocked: true,
      },
    });

    // Update group memberships if provided (only for EDUCATION accounts)
    if (Array.isArray(groupIds)) {
      if (user.accountType !== "EDUCATION") {
        return NextResponse.json(
          { error: "Only education accounts can be assigned to groups" },
          { status: 400 }
        );
      }

      await prisma.studentGroupMember.deleteMany({
        where: { userId: id },
      });

      for (const groupId of groupIds) {
        await prisma.studentGroupMember.create({
          data: { userId: id, groupId },
        }).catch(() => {
          // Ignore duplicates or non-existent groups
        });
      }
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isAdmin) {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
