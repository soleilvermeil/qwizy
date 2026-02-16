import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/decks - List all decks (with enrollment status if authenticated)
export async function GET() {
  try {
    const decks = await prisma.deck.findMany({
      include: {
        fields: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const session = await getSession();
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
    const { name, description, fields } = body;

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
