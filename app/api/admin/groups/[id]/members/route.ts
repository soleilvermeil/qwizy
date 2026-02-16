import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/groups/[id]/members - Add members to group
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
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

    // Verify group exists
    const group = await prisma.studentGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    let added = 0;
    for (const userId of userIds) {
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
    const session = await getSession();
    if (!session || !session.isAdmin) {
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

    const result = await prisma.studentGroupMember.deleteMany({
      where: {
        groupId,
        userId: { in: userIds },
      },
    });

    return NextResponse.json({ removed: result.count });
  } catch (error) {
    console.error("Error removing members:", error);
    return NextResponse.json(
      { error: "Failed to remove members" },
      { status: 500 }
    );
  }
}
