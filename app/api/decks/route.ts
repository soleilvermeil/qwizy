import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAdminOrTeacherSession } from "@/lib/admin-auth";

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

    // Teachers see only their own decks (with group assignments)
    if (session?.accountType === "TEACHER") {
      const decks = await prisma.deck.findMany({
        where: { createdById: session.userId },
        include: {
          fields: { orderBy: { position: "asc" } },
          _count: { select: { cards: true } },
          groupAssignments: {
            select: { group: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ decks, enrolledDeckIds: [] });
    }

    // Build visibility filter for non-admin users
    let where: Record<string, unknown> = {};

    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          accountType: true,
          groupMemberships: {
            select: { groupId: true },
          },
        },
      });

      if (user?.accountType === "EDUCATION") {
        const userGroupIds = user.groupMemberships.map((m) => m.groupId);
        const groupDecks = await prisma.deckGroupAssignment.findMany({
          where: { groupId: { in: userGroupIds } },
          select: { deckId: true },
        });
        where = { id: { in: groupDecks.map((d) => d.deckId) } };
      } else {
        where = { visibility: "PUBLIC" };
      }
    } else {
      where = { visibility: "PUBLIC" };
    }

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

// POST /api/decks - Create a new deck (admin or teacher)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAdminOrTeacherSession();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, fields, visibility = "PUBLIC" } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Deck name is required" },
        { status: 400 }
      );
    }

    // Teachers can only create EDUCATION_ONLY decks
    const resolvedVisibility = auth.isTeacher
      ? "EDUCATION_ONLY"
      : (visibility === "EDUCATION_ONLY" ? "EDUCATION_ONLY" : "PUBLIC");

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
        visibility: resolvedVisibility,
        createdById: auth.session.userId,
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

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
