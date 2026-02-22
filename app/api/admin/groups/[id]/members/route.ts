import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminOrTeacherSession, canAccess } from "@/lib/admin-auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/groups/[id]/members - Add members to group
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const body = await request.json();
    const { userIds } = body as { userIds: string[] };

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "At least one user ID is required" },
        { status: 400 }
      );
    }

    const group = await prisma.studentGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (!canAccess(auth, group.createdById)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only EDUCATION accounts can be added; teachers can only add their own users
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, ...auth.scopeWhere },
      select: { id: true, accountType: true },
    });
    const educationUserIds = users
      .filter((u) => u.accountType === "EDUCATION")
      .map((u) => u.id);

    if (educationUserIds.length === 0) {
      return NextResponse.json(
        { error: "Only education accounts can be added to groups" },
        { status: 400 }
      );
    }

    let added = 0;
    for (const userId of educationUserIds) {
      try {
        await prisma.studentGroupMember.upsert({
          where: { userId_groupId: { userId, groupId } },
          update: {},
          create: { userId, groupId },
        });
        added++;
      } catch {
        // Skip non-existent users
      }
    }

    // Auto-enroll new members in mandatory decks for this group
    const mandatoryAssignments = await prisma.deckGroupAssignment.findMany({
      where: { groupId, mandatory: true },
      select: { deckId: true },
    });

    if (mandatoryAssignments.length > 0) {
      for (const userId of educationUserIds) {
        for (const { deckId } of mandatoryAssignments) {
          await prisma.userDeck.upsert({
            where: { userId_deckId: { userId, deckId } },
            update: {},
            create: { userId, deckId },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ added });
  } catch (error) {
    console.error("Error adding members:", error);
    return NextResponse.json(
      { error: "Failed to add members" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/groups/[id]/members - Remove members from group
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;

    const group = await prisma.studentGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (!canAccess(auth, group.createdById)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { userIds } = body as { userIds: string[] };

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "At least one user ID is required" },
        { status: 400 }
      );
    }

    // Before removing, get decks assigned to this group for cleanup
    const groupAssignments = await prisma.deckGroupAssignment.findMany({
      where: { groupId },
      select: { deckId: true },
    });
    const assignedDeckIds = groupAssignments.map((a) => a.deckId);

    const result = await prisma.studentGroupMember.deleteMany({
      where: {
        groupId,
        userId: { in: userIds },
      },
    });

    // Clean up deck enrollments for removed EDUCATION members
    if (assignedDeckIds.length > 0 && result.count > 0) {
      const removedUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          accountType: "EDUCATION",
        },
        select: {
          id: true,
          groupMemberships: { select: { groupId: true } },
        },
      });

      for (const user of removedUsers) {
        const otherGroupIds = user.groupMemberships.map((m) => m.groupId);

        for (const deckId of assignedDeckIds) {
          // Is the deck still assigned to another of the user's groups?
          if (otherGroupIds.length > 0) {
            const stillAssigned = await prisma.deckGroupAssignment.findFirst({
              where: { deckId, groupId: { in: otherGroupIds } },
            });
            if (stillAssigned) continue;
          }

          // No remaining access -- unenroll
          await prisma.userDeck.deleteMany({
            where: { userId: user.id, deckId },
          });
        }
      }
    }

    return NextResponse.json({ removed: result.count });
  } catch (error) {
    console.error("Error removing members:", error);
    return NextResponse.json(
      { error: "Failed to remove members" },
      { status: 500 }
    );
  }
}
