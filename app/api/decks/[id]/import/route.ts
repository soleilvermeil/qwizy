import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

interface CardData {
  values: { fieldId: string; value: string }[];
  tags?: string;
}

// POST /api/decks/[id]/import - Bulk import cards (admin only)
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
    const { cards } = body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "No cards to import" },
        { status: 400 }
      );
    }

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
    let nextPosition = (maxPositionResult._max.position ?? -1) + 1;

    // Validate field IDs
    const validFieldIds = new Set(deck.fields.map((f) => f.id));

    // Create cards in a transaction
    const createdCards = await prisma.$transaction(
      cards.map((cardData: CardData) => {
        const position = nextPosition++;
        return prisma.card.create({
          data: {
            deckId: id,
            position,
            tags: cardData.tags || "",
            values: {
              create: cardData.values
                .filter(
                  (v) => validFieldIds.has(v.fieldId) && v.value.trim() !== ""
                )
                .map((v) => ({
                  fieldId: v.fieldId,
                  value: v.value.trim(),
                })),
            },
          },
        });
      })
    );

    return NextResponse.json(
      {
        success: true,
        imported: createdCards.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing cards:", error);
    return NextResponse.json(
      { error: "Failed to import cards" },
      { status: 500 }
    );
  }
}
