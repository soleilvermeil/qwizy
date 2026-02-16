import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * Auto-enroll all members of a group into a specific deck.
 * Skips users who are already enrolled.
 */
async function autoEnrollGroupMembers(groupId: string, deckId: string) {
  const members = await prisma.studentGroupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  for (const { userId } of members) {
    await prisma.userDeck.upsert({
      where: { userId_deckId: { userId, deckId } },
      update: {},
      create: { userId, deckId },
    });
  }
}

/**
 * When decks are removed from a group, unenroll EDUCATION users who no longer
 * have access through any of their other groups.
 *
 * For each removed deck and each EDUCATION member of the group:
 *   1. Check if the deck is assigned to any OTHER group the user belongs to.
 *   2. If not, check if the deck is PUBLIC and any other group allows browsing.
 *   3. If neither, unenroll the user from the deck.
 */
async function cleanupRemovedDecks(
  groupId: string,
  removedDeckIds: string[]
) {
  if (removedDeckIds.length === 0) return;

  // Get EDUCATION members of this group
  const members = await prisma.studentGroupMember.findMany({
    where: { groupId },
    select: {
      user: {
        select: {
          id: true,
          accountType: true,
          groupMemberships: { select: { groupId: true } },
        },
      },
    },
  });

  const educationMembers = members
    .map((m) => m.user)
    .filter((u) => u.accountType === "EDUCATION");

  if (educationMembers.length === 0) return;

  // Fetch visibility for all removed decks
  const removedDecks = await prisma.deck.findMany({
    where: { id: { in: removedDeckIds } },
    select: { id: true, visibility: true },
  });
  const deckVisibility = new Map(removedDecks.map((d) => [d.id, d.visibility]));

  for (const user of educationMembers) {
    // Other groups this user belongs to (excluding the current one)
    const otherGroupIds = user.groupMemberships
      .map((m) => m.groupId)
      .filter((gId) => gId !== groupId);

    for (const deckId of removedDeckIds) {
      // 1. Is the deck still assigned to another of the user's groups?
      if (otherGroupIds.length > 0) {
        const stillAssigned = await prisma.deckGroupAssignment.findFirst({
          where: {
            deckId,
            groupId: { in: otherGroupIds },
          },
        });
        if (stillAssigned) continue; // User keeps access
      }

      // 2. Is the deck PUBLIC and does any other group allow browsing?
      if (deckVisibility.get(deckId) === "PUBLIC" && otherGroupIds.length > 0) {
        const canBrowse = await prisma.studentGroup.findFirst({
          where: {
            id: { in: otherGroupIds },
            canBrowsePublicDecks: true,
          },
        });
        if (canBrowse) continue; // User can still see it via public browsing
      }

      // No remaining access -- unenroll
      await prisma.userDeck.deleteMany({
        where: { userId: user.id, deckId },
      });
    }
  }
}

// GET /api/admin/groups/[id] - Get group detail
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

    const group = await prisma.studentGroup.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                username: true,
                accountType: true,
                newCardsPerDay: true,
                newCardsPerDayLocked: true,
                createdAt: true,
              },
            },
          },
          orderBy: { user: { username: "asc" } },
        },
        deckAssignments: {
          select: {
            id: true,
            mandatory: true,
            deck: {
              select: {
                id: true,
                name: true,
                description: true,
                visibility: true,
                _count: {
                  select: { cards: true },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({
      group: {
        ...group,
        members: group.members.map((m) => m.user),
        decks: group.deckAssignments.map((a) => ({
          ...a.deck,
          assignmentId: a.id,
          mandatory: a.mandatory,
        })),
        deckAssignments: undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/groups/[id] - Update group
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
    const { name, canBrowsePublicDecks, deckAssignments } = body;

    const data: Record<string, unknown> = {};
    if (name && name.trim()) {
      data.name = name.trim();
    }
    if (typeof canBrowsePublicDecks === "boolean") {
      data.canBrowsePublicDecks = canBrowsePublicDecks;
    }

    const group = await prisma.studentGroup.update({
      where: { id },
      data,
    });

    // Update deck assignments if provided
    // Accepts: deckAssignments: [{ deckId: string, mandatory: boolean }]
    if (Array.isArray(deckAssignments)) {
      // Snapshot current assignments to detect removals
      const previousAssignments = await prisma.deckGroupAssignment.findMany({
        where: { groupId: id },
        select: { deckId: true },
      });
      const previousDeckIds = new Set(previousAssignments.map((a) => a.deckId));

      // Delete existing assignments
      await prisma.deckGroupAssignment.deleteMany({
        where: { groupId: id },
      });

      // Create new assignments
      const newDeckIds = new Set<string>();
      for (const assignment of deckAssignments as { deckId: string; mandatory?: boolean }[]) {
        try {
          await prisma.deckGroupAssignment.create({
            data: {
              deckId: assignment.deckId,
              groupId: id,
              mandatory: assignment.mandatory ?? false,
            },
          });
          newDeckIds.add(assignment.deckId);

          // Auto-enroll all group members for mandatory decks
          if (assignment.mandatory) {
            await autoEnrollGroupMembers(id, assignment.deckId);
          }
        } catch {
          // Ignore non-existent decks or duplicates
        }
      }

      // Clean up enrollments for decks that were removed from this group
      const removedDeckIds = [...previousDeckIds].filter(
        (dId) => !newDeckIds.has(dId)
      );
      await cleanupRemovedDecks(id, removedDeckIds);
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/groups/[id] - Delete group
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

    // Before deleting, clean up enrollments for decks that were assigned
    const assignments = await prisma.deckGroupAssignment.findMany({
      where: { groupId: id },
      select: { deckId: true },
    });
    const assignedDeckIds = assignments.map((a) => a.deckId);

    if (assignedDeckIds.length > 0) {
      await cleanupRemovedDecks(id, assignedDeckIds);
    }

    await prisma.studentGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
