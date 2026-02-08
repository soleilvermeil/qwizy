import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/decks/[id]/cards - List cards in a deck
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const cards = await prisma.card.findMany({
      where: { deckId: id },
      include: {
        values: true,
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}

// POST /api/decks/[id]/cards - Create a new card (admin only)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { values, tags } = body;

    // Verify deck exists
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!deck) {
      return NextResponse.json(
        { error: "Deck not found" },
        { status: 404 }
      );
    }

    // Get max position for the deck
    const maxPositionResult = await prisma.card.aggregate({
      where: { deckId: id },
      _max: { position: true },
    });
    const nextPosition = (maxPositionResult._max.position ?? -1) + 1;

    // Create card with values and position
    const card = await prisma.card.create({
      data: {
        deckId: id,
        position: nextPosition,
        tags: tags || "",
        values: {
          create: values
            .filter((v: { fieldId: string; value: string }) => v.value.trim() !== "")
            .map((v: { fieldId: string; value: string }) => ({
              fieldId: v.fieldId,
              value: v.value.trim(),
            })),
        },
      },
      include: {
        values: true,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
