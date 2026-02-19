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

    const importedCount = await prisma.$transaction(async (tx) => {
      // Bulk-create all cards in a single INSERT
      const createdCards = await tx.card.createManyAndReturn({
        data: cards.map((cardData: CardData, i: number) => ({
          deckId: id,
          position: nextPosition + i,
          tags: cardData.tags || "",
        })),
        select: { id: true },
      });

      // Build all card values in one flat array, then bulk-insert
      const allValues = createdCards.flatMap((card, i) =>
        (cards[i] as CardData).values
          .filter(
            (v: CardData["values"][number]) =>
              validFieldIds.has(v.fieldId) && v.value.trim() !== ""
          )
          .map((v: CardData["values"][number]) => ({
            cardId: card.id,
            fieldId: v.fieldId,
            value: v.value.trim(),
          }))
      );

      if (allValues.length > 0) {
        await tx.cardValue.createMany({ data: allValues });
      }

      return createdCards.length;
    }, { timeout: 60000 });

    return NextResponse.json(
      {
        success: true,
        imported: importedCount,
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
