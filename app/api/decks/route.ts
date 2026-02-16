import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/decks - List decks visible to the current user
export async function GET() {
  try {
    const session = await getSession();

    // Admin sees everything
    if (session?.isAdmin) {
      const decks = await prisma.deck.findMany({
        include: {
          fields: { orderBy: { position: "asc" } },
          _count: { select: { cards: true } },
          groupAssignments: {
            select: { group: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const enrolledDeckIds = (
        await prisma.userDeck.findMany({
          where: { userId: session.userId },
          select: { deckId: true },
        })
      ).map((e) => e.deckId);

      return NextResponse.json({ decks, enrolledDeckIds });
    }

    // Build visibility filter for non-admin users
    let visibleDeckIds: string[] | null = null; // null = no restriction needed

    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          accountType: true,
          groupMemberships: {
            select: {
              group: {
                select: {
                  id: true,
                  canBrowsePublicDecks: true,
                },
              },
            },
          },
        },
      });

      if (user?.accountType === "EDUCATION") {
        // Education users: restricted visibility
        const userGroupIds = user.groupMemberships.map((m) => m.group.id);
        const canBrowsePublic = user.groupMemberships.some(
          (m) => m.group.canBrowsePublicDecks
        );

        // Get decks assigned to user's groups
        const groupDecks = await prisma.deckGroupAssignment.findMany({
          where: { groupId: { in: userGroupIds } },
          select: { deckId: true },
        });
        const groupDeckIds = new Set(groupDecks.map((d) => d.deckId));

        if (canBrowsePublic) {
          // Can see PUBLIC decks + group-assigned decks
          const publicDecks = await prisma.deck.findMany({
            where: { visibility: "PUBLIC" },
            select: { id: true },
          });
          visibleDeckIds = [
            ...publicDecks.map((d) => d.id),
            ...groupDeckIds,
          ];
        } else {
          // Can only see group-assigned decks
          visibleDeckIds = [...groupDeckIds];
        }
      }
      // PERSONAL users see all PUBLIC + their group-assigned decks (if any)
      // Since PERSONAL users have no restrictions on PUBLIC, we only need to
      // add RESTRICTED decks from their groups
    }

    const where = visibleDeckIds !== null
      ? { id: { in: visibleDeckIds } }
      : { OR: [{ visibility: "PUBLIC" }, ...(session ? [{
          groupAssignments: {
            some: {
              group: {
                members: {
                  some: { userId: session.userId },
                },
              },
            },
          },
        }] : [])] };

    const decks = await prisma.deck.findMany({
      where,
      include: {
        fields: { orderBy: { position: "asc" } },
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrolledDeckIds = session
      ? (
          await prisma.userDeck.findMany({
            where: { userId: session.userId },
            select: { deckId: true },
          })
        ).map((e) => e.deckId)
      : [];

    return NextResponse.json({ decks, enrolledDeckIds });
  } catch (error) {
    console.error("Error fetching decks:", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}

// POST /api/decks - Create a new deck (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, fields, visibility = "PUBLIC", groupIds = [] } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Deck name is required" },
        { status: 400 }
      );
    }

    // Default fields if none provided
    const deckFields = fields && fields.length > 0
      ? fields
      : [
          { name: "Front", position: 0 },
          { name: "Back", position: 1 },
        ];

    const deck = await prisma.deck.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        visibility: visibility === "RESTRICTED" ? "RESTRICTED" : "PUBLIC",
        fields: {
          create: deckFields.map((f: { name: string }, index: number) => ({
            name: f.name.trim(),
            position: index,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { position: "asc" },
        },
      },
    });

    // Create group assignments if restricted
    if (groupIds.length > 0) {
      for (const groupId of groupIds) {
        await prisma.deckGroupAssignment.create({
          data: { deckId: deck.id, groupId },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
